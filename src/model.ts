import { Adapter } from "./adapters/adapter.ts";

export type ExtendedModel<T> = { new (): T } & typeof Model;

/**
 * Database model
 */
export abstract class Model {
  static tableName: string;
  static primaryKey: string = "id";
  static adapter: Adapter;
  static fields: { [key: string]: any };

  public id!: number;

  /**
   * Search for a single instance. Returns the first instance found, or null if none can be found
   * 
   * @param id primary key
   */
  public static async findOne<T extends Model>(
    this: ExtendedModel<T>,
    id: number,
  ): Promise<T | null> {
    // TODO: give the user option to query the fields (not only the primary key)
    const result = await this.adapter
      .queryBuilder(this.tableName)
      .where(this.primaryKey, "=", id)
      .execute();

    // If the record is not found, return null.
    // Otherwise, return the model instance with the data
    if (result.length < 1) {
      return null;
    } else {
      return this.createModel(result[0]);
    }
  }

  /**
   * Search for multiple instance
   */
  public static async find<T extends Model>(
    this: ExtendedModel<T>,
  ): Promise<T[]> {
    // TODO: give the user option to query the fields (not only the primary key)
    const result = await this.adapter
      .queryBuilder(this.tableName)
      .execute();

    return this.createModels(result);
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
      (this as any)[item] = this.normalizeData(
        (this as any)[item],
        modelClass.fields[item],
      );
    }

    // Bind all values to the `data` variable
    const data: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(this)) {
      data[key] = value;
    }

    // Save record to the database
    await modelClass.adapter
      .queryBuilder(modelClass.tableName)
      .insert(data)
      .execute();

    return this;
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
      if (type === Date && !(result[field] instanceof Date)) {
        result[field] = new Date(result[field]);
      } else if (type === String && typeof result[field] !== "string") {
        result[field] = new String(result[field]).toString();
      } else if (type === Number && typeof result[field] !== "number") {
        result[field] = new Number(result[field]);
      }
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
  private normalizeData(value: any, type: any): any {
    if (type === Date && !(value instanceof Date)) {
      value = new Date(value);
    } else if (type === String && typeof value !== "string") {
      value = new String(value).toString();
    } else if (type === Number && typeof value !== "number") {
      value = new Number(value);
    }

    return value;
  }
}
