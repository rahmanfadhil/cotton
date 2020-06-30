import { Adapter } from "./adapters/adapter.ts";
import { Reflect } from "./utils/reflect.ts";
import { NumberUtils } from "./utils/number.ts";

export type ExtendedModel<T> = { new (): T } & typeof Model;

/**
 * Transform database value to JavaScript types
 */
export type FieldType = "string" | "number" | "date" | "boolean";

/**
 * Information about table the table column
 */
export interface ColumnDescription {
  type: FieldType;
  name: string;
}

export interface FindOptions<T> {
  limit?: number;
  offset?: number;
  where?: Partial<T>;
}

/**
 * Model field
 * 
 * @param type the JavaScript type which will be transformed
 */
export function Field(type?: FieldType) {
  return (target: Object, propertyKey: string) => {
    let columns: ColumnDescription[] = [];

    if (Reflect.hasMetadata("db:columns", target)) {
      columns = Reflect.getMetadata("db:columns", target);
    }

    if (type) {
      columns.push({ type, name: propertyKey });
    } else {
      const fieldType = Reflect.getMetadata(
        "design:type",
        target,
        propertyKey,
      );

      if (fieldType === String) {
        columns.push({ type: "string", name: propertyKey });
      } else if (fieldType === Number) {
        columns.push({ type: "number", name: propertyKey });
      } else if (fieldType === Date) {
        columns.push({ type: "date", name: propertyKey });
      } else if (fieldType === Boolean) {
        columns.push({ type: "boolean", name: propertyKey });
      } else {
        throw new Error(
          `Cannot assign column '${propertyKey}' without a type!`,
        );
      }
    }

    Reflect.defineMetadata("db:columns", columns, target);
  };
}

/**
 * Database model
 */
export abstract class Model {
  static tableName: string;
  static primaryKey: string = "id";
  static adapter: Adapter;

  public id!: number;

  private _isSaved: boolean = false;
  private _original?: Model;

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
    return this._isSaved;
  }

  /**
   * Get the first record in a table or null null if none can be found
   */
  public static async findOne<T extends Model>(
    this: ExtendedModel<T>,
  ): Promise<T | null>;

  /**
   * Get a single record by primary key or null if none can be found
   * 
   * @param id primary key
   */
  public static async findOne<T extends Model>(
    this: ExtendedModel<T>,
    id: number,
  ): Promise<T | null>;

  /**
   * Search for a single instance. Returns the first instance found, or null if none can be found
   * 
   * @param where query columns
   */
  public static async findOne<T extends Model>(
    this: ExtendedModel<T>,
    where: Partial<T>,
  ): Promise<T | null>;

  /**
   * Search for a single instance. Returns the first instance found, or null if none can be found
   */
  public static async findOne<T extends Model>(
    this: ExtendedModel<T>,
    options?: number | Partial<T>,
  ): Promise<T | null> {
    // Initialize query builder
    const query = this.adapter.table(this.tableName);

    // If the options is a number, we assume that the user want to find based on the primary key.
    // Otherwise, query the columns.
    if (typeof options === "number") {
      query.where(this.primaryKey, "=", options);
    } else if (typeof options === "object") {
      for (const [column, value] of Object.entries(options)) {
        // TODO: allow user to use different operator
        query.where(column, value);
      }
    }

    // Execute query
    const result = await query.first().execute();

    // If the record is not found, return null.
    // Otherwise, return the model instance with the data
    if (result.length < 1) {
      return null;
    } else {
      return this.createModel(result[0], true);
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

    // Execute query
    const result = await query.execute();

    return this.createModels(result, true);
  }

  /**
   * Save model to the database
   */
  public async save(): Promise<this> {
    // Get the actual class to access static properties
    const modelClass = <typeof Model> this.constructor;

    // Normalize fields data
    this._normalize();

    // If the primary key is defined, we assume that the user want to update the record.
    // Otherwise, create a new record to the database.
    if (this._isSaved) {
      const { isDirty, changedFields } = this._compareWithOriginal();

      if (isDirty) {
        // Bind all values to the `data` variable
        const data = this._getValues(changedFields);

        // Save record to the database
        await modelClass.adapter
          .table(modelClass.tableName)
          .where(modelClass.primaryKey, this.id)
          .update(data)
          .execute();
      }
    } else {
      // Bind all values to the `data` variable
      const data = this._getValues();

      // Save record to the database
      await modelClass.adapter
        .table(modelClass.tableName)
        .insert(data)
        .execute();

      // Get last inserted id
      const lastInsertedId = await modelClass.adapter.getLastInsertedId({
        tableName: modelClass.tableName,
        primaryKey: modelClass.primaryKey,
      });

      // Set the primary key
      this.id = lastInsertedId;
      this._isSaved = true;
    }

    this._original = this._clone();

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
      const models = this.createModels<T>(data);
      return this._bulkSave<T>(models);
    } else {
      const model = this.createModel<T>(data);
      await model.save();
      return model;
    }
  }

  /**
   * Save multiple records to the database efficiently
   */
  private static async _bulkSave<T extends Model>(models: T[]): Promise<T[]> {
    // Get all model values
    const values = models.map((model) => model._getValues());

    // Execute query
    await this.adapter
      .table(this.tableName)
      .insert(values)
      .execute();

    // Get last inserted id
    const lastInsertedId = await this.adapter.getLastInsertedId({
      tableName: this.tableName,
      primaryKey: this.primaryKey,
    });

    // Set the model primary keys
    const ids = NumberUtils.range(
      lastInsertedId + 1 - models.length,
      lastInsertedId,
    );
    models.forEach((model, index) => {
      model.id = ids[index];
      model._isSaved = true;
      model._original = model._clone();
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
        "Cannot perform delete without where clause, use `truncate` to remove all records!",
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
    const truncateCommand = this.adapter.type === "sqlite"
      ? "DELETE FROM"
      : "TRUNCATE";
    await this.adapter.execute(`${truncateCommand} ${this.tableName};`);
  }

  // --------------------------------------------------------------------------------
  // TRANSFORM OBJECT TO MODEL CLASS
  // --------------------------------------------------------------------------------

  /**
   * Transform single plain JavaScript object to Model class
   * 
   * @param data List of plain JavaScript objects
   * @param fromDatabase Check wether the data is saved to the database or not
   */
  private static createModel<T>(
    data: { [key: string]: any },
    fromDatabase: boolean = false,
  ): T {
    const model = Object.create(this.prototype);
    const result = Object.assign(model, data, { _isSaved: fromDatabase });

    // Normalize input data
    result._normalize();

    // Save the original values
    result._original = result._clone();

    return result;
  }

  /**
   * Transform multiple plain JavaScript objects to Model classes
   * 
   * @param data List of plain JavaScript objects
   * @param fromDatabase Check wether the data is saved to the database or not
   */
  private static createModels<T>(
    data: { [key: string]: any }[],
    fromDatabase: boolean = false,
  ): T[] {
    return data.map((item) => this.createModel(item, fromDatabase));
  }

  // --------------------------------------------------------------------------------
  // PRIVATE HELPER METHODS
  // --------------------------------------------------------------------------------

  /**
   * Get all columns information
   */
  private _getColumns(): ColumnDescription[] {
    if (!Reflect.hasMetadata("db:columns", this)) {
      throw new Error("A model should have at least one column!");
    }

    return Reflect.getMetadata("db:columns", this);
  }

  /**
   * Normalize model value
   */
  private _normalize() {
    const columns = this._getColumns();

    for (const column of columns) {
      (this as any)[column.name] = this._normalizeValue(
        (this as any)[column.name],
        column.type,
      );
    }
  }

  /**
   * Normalize data with the expected type
   * 
   * @param value the value to be normalized
   * @param type the expected data type
   */
  private _normalizeValue(value: any, type: FieldType): any {
    if (typeof value === "undefined" || value === null) {
      return null;
    } else if (type === "date" && !(value instanceof Date)) {
      return new Date(value);
    } else if (type === "string" && typeof value !== "string") {
      return value.toString();
    } else if (type === "number" && typeof value !== "number") {
      return parseInt(value);
    } else if (type === "boolean" && typeof value !== "boolean") {
      return Boolean(value);
    }

    return value;
  }

  /**
   * Clone the instance, used for comparing with the original instance
   */
  private _clone() {
    const clone = Object.assign({}, this);
    Object.setPrototypeOf(clone, Model.prototype);
    return clone;
  }

  /**
   * Compare the current values with the last saved data
   */
  private _compareWithOriginal(): {
    isDirty: boolean;
    changedFields: string[];
  } {
    // If this._original is not defined, it means the object is not saved to the database yet which is dirty
    if (this._original) {
      let isDirty = false;
      const changedFields: string[] = [];

      // Loop for the fields, if one of the fields doesn't match, the object is dirty
      for (const column of this._getColumns()) {
        const value = (this as any)[column.name];
        const originalValue = (this._original as any)[column.name];

        if (value !== originalValue) {
          isDirty = true;
          changedFields.push(column.name);
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
  private _getValues(columns?: string[]): { [key: string]: any } {
    const selectedColumns: string[] = columns
      ? columns
      : this._getColumns().map((item) => item.name);

    const data: { [key: string]: any } = {};

    for (const column of selectedColumns) {
      data[column] = (this as any)[column];
    }

    return data;
  }
}
