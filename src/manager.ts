import {
  isSaved,
  compareWithOriginal,
  getTableName,
  getPrimaryKeyInfo,
  getValues,
  setSaved,
  mapValueProperties,
  getColumns,
  createModels,
  mapQueryResult,
  createModel,
  mapSingleQueryResult,
} from "./utils/models.ts";
import { Adapter } from "./adapters/adapter.ts";
import { QueryBuilder } from "./querybuilder.ts";
import { range } from "./utils/number.ts";

/**
 * Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U> ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
};

/**
 * Query options to find a single record.
 */
export interface FindOneOptions<T> {
  where?: DeepPartial<T>;
}

/**
 * Query options to find multiple records.
 */
export type FindOptions<T> = FindOneOptions<T> & {
  limit?: number;
  offset?: number;
};

/**
 * Manager allows you to perform queries to your model.
 */
export class Manager {
  /**
   * Create a model manager.
   * 
   * @param adapter the database adapter to perform queries
   */
  constructor(private adapter: Adapter) {}

  /**
   * Save model instance to the database.
   *
   * @param model the model you want to save
   */
  public async save<T extends Object>(model: T): Promise<T> {
    const tableName = getTableName(model.constructor);
    const primaryKeyInfo = getPrimaryKeyInfo(model.constructor);

    // If the record is saved, we assume that the user want to update the record.
    // Otherwise, create a new record to the database.
    if (isSaved(model)) {
      const { isDirty, diff } = compareWithOriginal(model);

      if (isDirty) {
        await this.adapter
          .table(tableName)
          .where(
            primaryKeyInfo.name,
            (model as any)[primaryKeyInfo.propertyKey],
          )
          .update(diff)
          .execute();
      }
    } else {
      const values = getValues(model);

      // Save record to the database
      const query = this.adapter
        .table(tableName)
        .insert(values);

      // The postgres adapter doesn't have `lastInsertedId`. So, we need to
      // manually return the primary key in order to set the model's primary key
      if (this.adapter.dialect === "postgres") {
        query.returning(primaryKeyInfo.name);
      }

      // Execute the query
      const result = await query.execute();

      // Get last inserted id
      const lastInsertedId: number = this.adapter.dialect === "postgres"
        ? result[result.length - 1][primaryKeyInfo.name] as number
        : this.adapter.lastInsertedId;

      // Set the primary key
      values[primaryKeyInfo.name] = lastInsertedId;

      // Populate empty properties with default value
      Object.assign(
        model,
        mapValueProperties(model.constructor, values, "propertyKey"),
      );
    }

    // Save the model's original values
    setSaved(model, true);

    return model;
  }

  /**
   * Find records that match given conditions.
   * 
   * @param modelClass the model you want to find
   * @param options find options for filtering the records
   */
  public async find<T>(
    modelClass: { new (): T },
    options?: FindOptions<T>,
  ): Promise<T[]> {
    // Initialize the query builder
    const query = this.setupQueryBuilder(modelClass, options);

    // Execute the query
    const result = await query.execute();

    // Build the model objects
    return createModels(modelClass, mapQueryResult(modelClass, result), true);
  }

  /**
   * Find a single record that match given conditions. If multiple
   * found, it will return the first one. 
   * 
   * @param modelClass the model you want to find
   * @param options find options for filtering the records
   */
  public async findOne<T>(
    modelClass: { new (): T },
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    // Initialize the query builder
    const query = this.setupQueryBuilder(modelClass, options);

    // Execute the query
    const result = await query.execute();

    // Build the model objects
    if (result.length >= 1) {
      return createModel(
        modelClass,
        mapSingleQueryResult(modelClass, result[0]),
        true,
      );
    } else {
      return null;
    }
  }

  /**
   * Remove given model from the database.
   * 
   * @param model the model you want to remove.
   */
  public async remove<T extends Object>(model: T): Promise<T> {
    const tableName = getTableName(model.constructor);
    const primaryKeyInfo = getPrimaryKeyInfo(model.constructor);

    // Only remove model if it's already saved
    if (isSaved(model)) {
      const id = (model as any)[primaryKeyInfo.propertyKey];
      await this.adapter
        .table(tableName)
        .where(primaryKeyInfo.name, id)
        .delete()
        .execute();

      // Remove the primary key
      delete (model as any)[primaryKeyInfo.propertyKey];
    }

    return model;
  }

  /**
   * Create a model instance and save it to the database.
   * 
   * @param modelClass the model you want to create
   * @param data the data you want your model to be populated with
   */
  public insert<T extends Object>(
    modelClass: { new (): T },
    data: DeepPartial<T>,
  ): Promise<T>;

  /**
   * Create model instances and save it to the database.
   * 
   * @param modelClass the model you want to create
   * @param data the data you want your model to be populated with
   */
  public insert<T extends Object>(
    modelClass: { new (): T },
    data: DeepPartial<T>[],
  ): Promise<T[]>;

  /**
   * Create model and save it to the database.
   */
  public insert<T extends Object>(
    modelClass: { new (): T },
    data: DeepPartial<T> | DeepPartial<T>[],
  ): Promise<T | T[]> {
    if (Array.isArray(data)) {
      const models = createModels(modelClass, data as any);
      return this.bulkSave(modelClass, models);
    } else {
      const model = createModel(modelClass, data as any);
      return this.save(model);
    }
  }

  /**
   * Save multiple records to the database efficiently
   */
  private async bulkSave<T extends Object>(
    modelClass: { new (): T },
    models: T[],
  ): Promise<T[]> {
    const tableName = getTableName(modelClass);
    const primaryKeyInfo = getPrimaryKeyInfo(modelClass);

    // Get all model values
    const values = models.map((model) => getValues(model));

    // Execute query
    const query = this.adapter.table(tableName).insert(values);

    // The postgres adapter doesn't have any equivalient `lastInsertedId` property.
    // So, we need to manually return the primary key.
    if (this.adapter.dialect === "postgres") {
      query.returning(primaryKeyInfo.name);
    }

    // Execute the query
    const result = await query.execute();

    // Get last inserted id
    const lastInsertedId = this.adapter.dialect === "postgres"
      ? result[result.length - 1][primaryKeyInfo.name] as number
      : this.adapter.lastInsertedId;

    // Set the model primary keys
    const ids = range(
      lastInsertedId + 1 - models.length,
      lastInsertedId,
    );
    models.forEach((model, index) => {
      const value = values[index];

      // Set the primary key
      value[primaryKeyInfo.propertyKey] = ids[index];

      // Populate empty properties with default value
      Object.assign(
        model,
        mapValueProperties(model.constructor, value, "propertyKey"),
      );

      // Update the `isSaved` status and save the original values
      setSaved(model, true);
    });

    return models;
  }

  /**
   * Setup the query builder for find() and findOne()
   * 
   * @param modelClass the model class
   * @param options find options for filtering the records
   */
  private setupQueryBuilder(
    modelClass: Function,
    options?: FindOptions<{}>,
  ): QueryBuilder {
    const tableName = getTableName(modelClass);
    const query = this.adapter.table(tableName);

    // Implement the where statements
    if (options?.where) {
      const values = mapValueProperties(modelClass, options.where, "name");
      for (const [key, value] of Object.entries(values)) {
        query.where(key, value);
      }
    }

    // Add limit (if exists)
    if (options?.limit) {
      query.limit(options.limit);
    }

    // Add offset (if exists)
    if (options?.offset) {
      query.offset(options.offset);
    }

    // Select the model columns
    const columns: [string, string][] = getColumns(modelClass)
      .map((column) => [
        tableName + "." + column.name,
        tableName + "__" + column.name,
      ]);
    query.select(...columns);

    return query;
  }
}
