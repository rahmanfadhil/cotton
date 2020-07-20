import {
  Manager,
  FindOptions,
  FindOneOptions,
  DeepPartial,
} from "./manager.ts";

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
  public static find<T extends BaseModel>(
    this: ObjectType<T>,
    options?: FindOptions<T>,
  ): Promise<T[]> {
    return this.manager.find(this, options);
  }

  /**
   * Find a single record that match given conditions. If multiple
   * found, it will return the first one. 
   * 
   * @param options find options for filtering the records
   */
  public static findOne<T extends BaseModel>(
    this: ObjectType<T>,
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    return this.manager.findOne(this, options);
  }

  /**
   * Create this model instance and save it to the database.
   * 
   * @param data the data you want your model to be populated with
   */
  public static insert<T extends BaseModel>(
    this: ObjectType<T>,
    data: DeepPartial<T>,
  ): Promise<T>;

  /**
   * Create model instances and save it to the database.
   * 
   * @param data the data you want your model to be populated with
   */
  public static insert<T extends BaseModel>(
    this: ObjectType<T>,
    data: DeepPartial<T>[],
  ): Promise<T[]>;

  /**
   * Create model and save it to the database.
   */
  public static insert<T extends BaseModel>(
    this: ObjectType<T>,
    data: DeepPartial<T> | DeepPartial<T>[],
  ): Promise<T | T[]> {
    return this.manager.insert(this, data as DeepPartial<T>);
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
