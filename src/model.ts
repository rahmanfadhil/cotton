import { BaseAdapter } from "./baseadapter.ts";

export type ExtendedModel<T> = { new (): T } & typeof Model;

/**
 * Database model
 */
export abstract class Model {
  static tableName: string;
  static primaryKey: string = "id";
  static adapter: BaseAdapter;
  static fields: { [key: string]: any };

  public id: number;

  /**
   * Search for a single instance. Returns the first instance found, or null if none can be found.
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
   * Search for multiple instance.
   * 
   * @param id primary key
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
}
