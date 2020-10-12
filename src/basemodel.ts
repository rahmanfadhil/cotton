import type { Manager, DeepPartial } from "./manager.ts";
import type { ModelQuery } from "./modelquery.ts";

export type ObjectType<T> = typeof BaseModel & { new (): T };

/**
 * Manage your models directly from the model class.
 */
export abstract class BaseModel {
  private static manager: Manager;

  /**
   * Find records that match given conditions from the database.
   * 
   * @param options find options for filtering the records
   */
  public static query<T extends BaseModel>(this: ObjectType<T>): ModelQuery<T> {
    return this.manager.query(this);
  }

  /**
   * Saves current model to the database.
   */
  public save(): Promise<this> {
    const modelClass = <typeof BaseModel> this.constructor;
    return modelClass.manager.save(this);
  }

  /**
   * Remove current model from the database.
   */
  public remove(): Promise<this> {
    const modelClass = <typeof BaseModel> this.constructor;
    return modelClass.manager.remove(this);
  }
}
