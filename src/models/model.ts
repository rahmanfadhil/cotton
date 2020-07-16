import { Adapter } from "../adapters/adapter.ts";
import { range } from "../utils/number.ts";
import { RelationType } from "./fields.ts";
import {
  getModelColumns,
  getModelRelations,
  extractRelationalRecord,
  createModel,
  createModels,
  normalizeModel,
  saveOriginalValue,
  getOriginalValue,
  mapRelationalResult,
} from "../utils/models.ts";
import { quote } from "../utils/dialect.ts";

export type ExtendedModel<T> = { new (): T } & typeof Model;

export interface FindOptions<T> {
  limit?: number;
  offset?: number;
  where?: Partial<T>;
  includes?: string[];
}

/**
 * Database model
 */
export abstract class Model {
  static tableName: string;
  static primaryKey: string = "id";
  static adapter: Adapter;

  public id!: number;

  /**
   * Check if this instance's fields are changed
   */
  public isDirty(): boolean {
    return this._compareWithOriginal().isDirty;
  }

  /**
   * Check if a this instance is saved to the database
   */
  public isSaved(): boolean {
    return typeof this.id === "number";
  }

  /**
   * Search for a single instance. Returns the first instance found, or null if none can be found
   */
  public static async findOne<T extends Model>(
    this: ExtendedModel<T>,
    options?: FindOptions<T>,
  ): Promise<T | null> {
    // Initialize query builder
    const query = this.adapter.table(this.tableName);

    // Add where clauses (if exists)
    if (options && options.where) {
      for (const [column, value] of Object.entries(options.where)) {
        // TODO: allow user to use different operator
        query.where(column, value);
      }
    }

    // Add maximum number of records (if exists)
    if (options && options.limit) {
      query.limit(options.limit);
    }

    // Add offset (if exists)
    if (options && options.offset) {
      query.offset(options.offset);
    }

    if (options && options.includes) {
      const relations = getModelRelations(this, options.includes);
      for (const relation of relations) {
        const tableName = relation.getModel().tableName;

        if (relation.type === RelationType.HasMany) {
          const columnA = tableName + "." + relation.targetColumn;
          const columnB = this.tableName + ".id";
          query.leftJoin(tableName, columnA, columnB);
        } else if (relation.type === RelationType.BelongsTo) {
          const columnA = tableName + ".id";
          const columnB = this.tableName + "." + relation.targetColumn;
          query.leftJoin(tableName, columnA, columnB);
        }

        const columnNames = getModelColumns(relation.getModel())
          .map((item): [string, string] => [
            tableName + "." + item.name,
            tableName + "__" + item.name,
          ]);
        query.select(...columnNames);
      }
    }

    // Select all columns
    const columnNames = getModelColumns(this)
      .map((item): [string, string] => [
        this.tableName + "." + item.name,
        this.tableName + "__" + item.name,
      ]);
    query.select(...columnNames);

    // Execute query
    const result = await query.first().execute();

    // If the record is not found, return null.
    // Otherwise, return the model instance with the data
    if (result.length < 1) {
      return null;
    } else {
      let record: { [key: string]: any };

      if (options && Array.isArray(options.includes)) {
        record = mapRelationalResult(this, options.includes, result)[0];
      } else {
        record = extractRelationalRecord(result[0], this.tableName);
      }

      return createModel(this, record, true);
    }
  }

  /**
   * Search for multiple instance
   * 
   * @param options query options
   */
  public static async find<T extends Model>(
    this: ExtendedModel<T>,
    options?: FindOptions<T>,
  ): Promise<T[]> {
    // Initialize query builder
    const query = this.adapter.table(this.tableName);

    // Add where clauses (if exists)
    if (options && options.where) {
      for (const [column, value] of Object.entries(options.where)) {
        // TODO: allow user to use different operator
        query.where(column, value);
      }
    }

    // Add maximum number of records (if exists)
    if (options && options.limit) {
      query.limit(options.limit);
    }

    // Add offset (if exists)
    if (options && options.offset) {
      query.offset(options.offset);
    }

    if (options && options.includes) {
      const relations = getModelRelations(this, options.includes);
      for (const relation of relations) {
        const tableName = relation.getModel().tableName;

        if (relation.type === RelationType.HasMany) {
          const columnA = tableName + "." + relation.targetColumn;
          const columnB = this.tableName + ".id";
          query.leftJoin(tableName, columnA, columnB);
        } else if (relation.type === RelationType.BelongsTo) {
          const columnA = tableName + ".id";
          const columnB = this.tableName + "." + relation.targetColumn;
          query.leftJoin(tableName, columnA, columnB);
        }

        const columnNames = getModelColumns(relation.getModel())
          .map((item): [string, string] => [
            tableName + "." + item.name,
            tableName + "__" + item.name,
          ]);
        query.select(...columnNames);
      }
    }

    // Select all columns
    const columnNames = getModelColumns(this)
      .map((item): [string, string] => [
        this.tableName + "." + item.name,
        this.tableName + "__" + item.name,
      ]);
    query.select(...columnNames);

    // Execute query
    const result = await query.execute<any>();

    let records: any[];

    if (options && Array.isArray(options.includes)) {
      records = mapRelationalResult(this, options.includes, result);
    } else {
      records = result.map((item) => {
        return extractRelationalRecord(item, this.tableName);
      });
    }

    return createModels(this, records, true);
  }

  /**
   * Save model to the database
   */
  public async save(): Promise<this> {
    // Get the actual class to access static properties
    const modelClass = <typeof Model> this.constructor;

    // Normalize fields data
    normalizeModel(this);

    // If the primary key is defined, we assume that the user want to update the record.
    // Otherwise, create a new record to the database.
    if (this.isSaved()) {
      const { isDirty, changedFields } = this._compareWithOriginal();

      if (isDirty) {
        // Bind all values to the `data` variable
        const data = this.values(changedFields);

        // Save record to the database
        await modelClass.adapter
          .table(modelClass.tableName)
          .where(modelClass.primaryKey, this.id)
          .update(data)
          .execute();
      }
    } else {
      // Bind all values to the `data` variable
      const data = this.values();

      // Save record to the database
      const query = modelClass.adapter
        .table(modelClass.tableName)
        .insert(data);

      if (modelClass.adapter.dialect === "postgres") {
        query.returning("id");
      }

      const result = await query.execute<{ id: number }>();

      // Get last inserted id
      let lastInsertedId: number;

      if (modelClass.adapter.dialect === "postgres") {
        lastInsertedId = result[result.length - 1].id;
      } else {
        lastInsertedId = modelClass.adapter.lastInsertedId;
      }

      // Set the primary key
      this.id = lastInsertedId;
    }

    saveOriginalValue(this);

    return this;
  }

  /**
   * Delete model from the database
   */
  public async remove(): Promise<void> {
    // Get the actual class to access static properties
    const modelClass = <typeof Model> this.constructor;

    // Delete from the database
    await modelClass.adapter.table(modelClass.tableName)
      .where(modelClass.primaryKey, this.id)
      .delete()
      .execute();
  }

  /**
   * Create a model instance and save it to the database.
   * 
   * @param data record data
   */
  public static async insert<T extends Model>(
    this: ExtendedModel<T>,
    data: Partial<T>,
  ): Promise<T>;

  /**
   * Create a model instance and save it to the database.
   * 
   * @param data array of records
   */
  public static async insert<T extends Model>(
    this: ExtendedModel<T>,
    data: Partial<T>[],
  ): Promise<T[]>;

  /**
   * Create a model instance and save it to the database.
   * 
   * @param data model fields
   */
  public static async insert<T extends Model>(
    this: ExtendedModel<T>,
    data: Partial<T> | Partial<T>[],
  ): Promise<T | T[]> {
    if (Array.isArray(data)) {
      const models = createModels<T>(this, data);
      return this._bulkSave<T>(models);
    } else {
      const model = createModel<T>(this, data);
      await model.save();
      return model;
    }
  }

  /**
   * Save multiple records to the database efficiently
   */
  private static async _bulkSave<T extends Model>(models: T[]): Promise<T[]> {
    // Get all model values
    const values = models.map((model) => model.values());

    // Execute query
    const query = this.adapter
      .table(this.tableName)
      .insert(values);

    if (this.adapter.dialect === "postgres") {
      query.returning("id");
    }

    const result = await query.execute<{ id: number }>();

    // Get last inserted id
    let lastInsertedId: number;

    if (this.adapter.dialect === "postgres") {
      lastInsertedId = result[result.length - 1].id;
    } else {
      lastInsertedId = this.adapter.lastInsertedId;
    }

    // Set the model primary keys
    const ids = range(
      lastInsertedId + 1 - models.length,
      lastInsertedId,
    );
    models.forEach((model, index) => {
      model.id = ids[index];
      saveOriginalValue(model);
    });

    return models;
  }

  /**
   * Delete a single record by id
   */
  public static async deleteOne<T extends Model>(
    this: ExtendedModel<T>,
    id: number,
  ): Promise<void> {
    // TODO: Add options to query using where clause
    await this.adapter.table(this.tableName)
      .where(this.primaryKey, id)
      .delete()
      .execute();
  }

  /**
   * Delete multiple records
   * 
   * @param options query options
   */
  public static async delete<T extends Model>(
    this: ExtendedModel<T>,
    options: FindOptions<T>,
  ): Promise<void> {
    // Initialize query builder
    const query = this.adapter.table(this.tableName);

    // Add where clauses (if exists)
    if (options && options.where) {
      for (const [column, value] of Object.entries(options.where)) {
        // TODO: allow user to use different operator
        query.where(column, value);
      }
    } else {
      throw new Error(
        "Cannot perform delete without where clause, use `truncate` to delete all records!",
      );
    }

    if (options && options.limit) {
      query.limit(options.limit);
    }

    if (options && options.offset) {
      query.offset(options.offset);
    }

    // Execute query
    await query.delete().execute();
  }

  /**
   * Remove all records from a table.
   */
  public static async truncate(): Promise<void> {
    // sqlite TRUNCATE is a different command
    const truncateCommand = this.adapter.dialect === "sqlite"
      ? "DELETE FROM"
      : "TRUNCATE";

    // Surround table name with quote
    const tableName = quote(this.tableName, this.adapter.dialect);

    await this.adapter.query(`${truncateCommand} ${tableName};`);
  }

  // --------------------------------------------------------------------------------
  // TRANSFORM OBJECT TO MODEL CLASS
  // --------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------
  // PRIVATE HELPER METHODS
  // --------------------------------------------------------------------------------

  /**
   * Compare the current values with the last saved data
   */
  private _compareWithOriginal(): {
    isDirty: boolean;
    changedFields: string[];
  } {
    const originalValue = getOriginalValue(this);

    // If there's is no original value, the object is not saved to the database yet
    // which means it's dirty.
    if (originalValue) {
      let isDirty = false;
      const changedFields: string[] = [];

      // Loop for the fields, if one of the fields doesn't match, the object is dirty
      for (const column of getModelColumns(this.constructor)) {
        const value = (this as any)[column.propertyKey];

        if (value !== originalValue[column.name]) {
          isDirty = true;
          changedFields.push(column.propertyKey);
        }
      }

      return { isDirty, changedFields };
    } else {
      return { isDirty: true, changedFields: [] };
    }
  }

  /**
   * Get model values as a plain JavaScript object
   * 
   * @param columns the columns to be retrieved
   */
  public values(columns?: string[]): { [key: string]: any } {
    const selectedColumns = columns
      ? getModelColumns(this.constructor)
        .filter((item) => columns.includes(item.propertyKey))
      : getModelColumns(this.constructor);

    const data: { [key: string]: any } = {};

    for (const column of selectedColumns) {
      const value = (this as any)[column.propertyKey];

      if (column.isPrimaryKey) {
        if (this.isSaved()) {
          data[column.name] = value;
        }
      } else {
        if (typeof value === "undefined") {
          // If the value is undefined, check the default value. Then, if the column
          // is nullable, set it to null. Otherwise, throw an error.
          if (typeof column.default !== "undefined") {
            // If the default value is a function, execute it and get the returned value
            data[column.name] = typeof column.default === "function"
              ? column.default()
              : column.default;
          } else if (column.isNullable === true) {
            data[column.name] = null;
          } else {
            throw new Error(
              `Field '${column.propertyKey}' cannot be empty!'`,
            );
          }
        } else {
          data[column.name] = (this as any)[column.propertyKey];
        }
      }
    }

    return data;
  }
}
