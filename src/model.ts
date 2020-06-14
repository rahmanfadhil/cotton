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
      return this.createModel(result.records[0]);
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

    return this.createModels(result.records);
  }

  /**
   * Save model to the database
   * 
   * TODO: if the model is already exists, update.
   * TODO: set the primary key property when saved. (SQLite use `select seq from sqlite_sequence where name='users';`)
   */
  public async save(): Promise<this> {
    // Get the actual class to access static properties
    const modelClass = <typeof Model> this.constructor;

    // Normalize fields data
    for (const item of Object.keys(modelClass.fields)) {
      (this as any)[item] = modelClass.normalizeData(
        (this as any)[item],
        modelClass.fields[item].type,
      );
    }

    // Bind all values to the `data` variable
    const data: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(this)) {
      data[key] = value;
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

  // --------------------------------------------------------------------------------
  // TRANSFORM OBJECT TO MODEL CLASS
  // --------------------------------------------------------------------------------

  /**
   * Transform single plain JavaScript object to Model class
   * 
   * @param model The database model
   * @param data List of plain JavaScript objects
   */
  private static createModel<T>(data: { [key: string]: any }): T {
    const model = Object.create(this.prototype);
    const result = Object.assign(model, data);

    for (const [field, type] of Object.entries(this.fields)) {
      result[field] = this.normalizeData(result[field], type.type);
    }

    return result;
  }

  /**
   * Transform multiple plain JavaScript objects to Model classes
   * 
   * @param model The database model
   * @param data List of plain JavaScript objects
   */
  private static createModels<T>(data: { [key: string]: any }[]): T[] {
    return data.map((item) => this.createModel(item));
  }

  /**
   * Normalize data with the expected type
   * 
   * @param value the value to be normalize
   * @param type the expected data type
   */
  private static normalizeData(value: any, type: FieldType): any {
    if (type === FieldType.DATE && !(value instanceof Date)) {
      value = new Date(value);
    } else if (type === FieldType.STRING && typeof value !== "string") {
      value = new String(value).toString();
    } else if (type === FieldType.NUMBER && typeof value !== "number") {
      value = new Number(value);
    }

    return value;
  }
}
