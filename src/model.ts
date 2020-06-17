import { Adapter } from "./adapters/adapter.ts";

export type ExtendedModel<T> = { new (): T } & typeof Model;

/**
 * Transform database value to JavaScript types
 */
export enum FieldType {
  STRING = "string",
  NUMBER = "number",
  DATE = "date",
}

/**
 * Information about table the table column
 */
export interface FieldDescription {
  type: FieldType;
}

export interface FindOptions<T> {
  limit?: number;
  offset?: number;
  where?: Partial<T>;
}

/**
 * Database model
 */
export abstract class Model {
  static tableName: string;
  static primaryKey: string = "id";
  static adapter: Adapter;
  static fields: { [key: string]: FieldDescription };

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
    const query = this.adapter.queryBuilder(this.tableName);

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
    const result = await query.execute();

    // If the record is not found, return null.
    // Otherwise, return the model instance with the data
    if (result.records.length < 1) {
      return null;
    } else {
      return this.createModel(result.records[0], true);
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
    const query = this.adapter.queryBuilder(this.tableName);

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

    return this.createModels(result.records, true);
  }

  /**
   * Save model to the database
   */
  public async save(): Promise<this> {
    // Get the actual class to access static properties
    const modelClass = <typeof Model> this.constructor;

    // Normalize fields data
    modelClass.normalizeModel(this);

    // If the primary key is defined, we assume that the user want to update the record.
    // Otherwise, create a new record to the database.
    if (this._isSaved) {
      const { isDirty, changedFields } = this._compareWithOriginal();

      console.log("UPDATE!!");

      if (isDirty) {
        // Bind all values to the `data` variable
        const data: { [key: string]: any } = {};
        for (const key of changedFields) {
          data[key] = (this as any)[key];
        }

        // Save record to the database
        await modelClass.adapter
          .queryBuilder(modelClass.tableName)
          .where(modelClass.primaryKey, this.id)
          .update(data)
          .execute();
      }
    } else {
      // Bind all values to the `data` variable
      const data: { [key: string]: any } = {};
      for (const key of Object.keys(modelClass.fields)) {
        data[key] = (this as any)[key];
      }

      // Save record to the database
      const { lastInsertedId } = await modelClass.adapter
        .queryBuilder(modelClass.tableName)
        .insert(data)
        .execute({
          getLastInsertedId: true,
          info: {
            tableName: modelClass.tableName,
            primaryKey: modelClass.primaryKey,
          },
        });

      // Set the primary key
      this.id = lastInsertedId as number;
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
    await modelClass.adapter.queryBuilder(modelClass.tableName)
      .where(modelClass.primaryKey, this.id)
      .delete()
      .execute();
  }

  /**
   * Create a model instance and save it to the database.
   * 
   * @param data model fields
   * 
   * TODO: set the primary key property when saved. (SQLite use `select seq from sqlite_sequence where name='users';`)
   */
  public static async insert<T extends Model>(
    this: ExtendedModel<T>,
    data: Partial<T>,
  ): Promise<T> {
    const model = (this as typeof Model).createModel<T>(data);
    await model.save();
    return model;
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

  /**
   * Clone the instance, used for comparing with the original instance
   */
  private _clone() {
    const clone = Object.assign({}, this);
    Object.setPrototypeOf(clone, Model.prototype);
    return clone;
  }

  private _compareWithOriginal(): {
    isDirty: boolean;
    changedFields: string[];
  } {
    // If this._original is not defined, it means the object is not saved to the database yet which is dirty
    if (this._original) {
      const modelClass = <typeof Model> this.constructor;

      let isDirty = false;
      const changedFields: string[] = [];

      // Loop for the fields, if one of the fields doesn't match, the object is dirty
      for (const field of Object.keys(modelClass.fields)) {
        const value = (this as any)[field];
        const originalValue = (this._original as any)[field];

        if (value !== originalValue) {
          isDirty = true;
          changedFields.push(field);
        }
      }

      return { isDirty, changedFields };
    } else {
      return { isDirty: true, changedFields: [] };
    }
  }

  // --------------------------------------------------------------------------------
  // TRANSFORM OBJECT TO MODEL CLASS
  // --------------------------------------------------------------------------------

  /**
   * Transform single plain JavaScript object to Model class
   * 
   * @param data List of plain JavaScript objects
   * @param fromDatabase Check wether the data is saved to the database or not
   * 
   * TODO: implement fromDatabase
   */
  private static createModel<T>(
    data: { [key: string]: any },
    fromDatabase: boolean = false,
  ): T {
    const model = Object.create(this.prototype);
    const result = Object.assign(model, data, { _isSaved: fromDatabase });

    this.normalizeModel(result);

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

  /**
   * Normalize data with the expected type
   * 
   * @param value the value to be normalize
   * @param type the expected data type
   */
  private static normalizeValue(value: any, type: FieldType): any {
    if (type === FieldType.DATE && !(value instanceof Date)) {
      value = new Date(value);
    } else if (type === FieldType.STRING && typeof value !== "string") {
      value = new String(value).toString();
    } else if (type === FieldType.NUMBER && typeof value !== "number") {
      value = new Number(value);
    }

    return value;
  }

  /**
   * Normalize the whole model fields
   */
  private static normalizeModel<T>(model: T): T {
    for (const [field, type] of Object.entries(this.fields)) {
      (model as any)[field] = this.normalizeValue(
        (model as any)[field],
        type.type,
      );
    }

    return model;
  }
}
