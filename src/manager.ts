import {
  isSaved,
  compareWithOriginal,
  getTableName,
  getPrimaryKeyInfo,
  getValues,
  setSaved,
  mapValueProperties,
  createModels,
  createModel,
  getRelationValues,
} from "./utils/models.ts";
import { Adapter } from "./adapters/adapter.ts";
import { range } from "./utils/number.ts";
import { RelationType } from "./model.ts";
import { ModelQuery } from "./modelquery.ts";

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
  includes?: string[];
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
   * Query a model.
   * 
   * @param modelClass the model you want to query
   */
  public query<T extends Object>(modelClass: { new (): T }): ModelQuery<T> {
    return new ModelQuery(modelClass, this.adapter);
  }

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

      const relationalValues = getRelationValues(model);

      // If there's a belongs to relationship, add it to the INSERT statement
      for (const relation of relationalValues) {
        if (relation.description.type === RelationType.BelongsTo) {
          values[relation.description.targetColumn] = relation.value as number;
        }
      }

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

      // If there's a has many relationship, update the foreign key
      for (const relation of relationalValues) {
        if (relation.description.type === RelationType.HasMany) {
          const ids = relation.value as number[];
          const tableName = getTableName(relation.description.getModel());
          const relationPkInfo = getPrimaryKeyInfo(
            relation.description.getModel(),
          );

          await this.adapter
            .table(tableName)
            .update({
              [relation.description.targetColumn]:
                (model as any)[primaryKeyInfo.propertyKey],
            })
            .where(relationPkInfo.name, "in", ids)
            .execute();

          for (let i = 0; i < ids.length; i++) {
            (model as any)[relation.description.propertyKey][i][
              relation.description.targetColumn
            ] = (model as any)[primaryKeyInfo.propertyKey];
          }
        }
      }
    }

    // Save the model's original values
    setSaved(model, true);

    return model;
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
    // TODO: save relationships

    if (Array.isArray(data)) {
      const models = createModels(modelClass, data as any);
      return this.bulkInsert(modelClass, models);
    } else {
      const model = createModel(modelClass, data as any);
      return this.save(model);
    }
  }

  /**
   * Insert multiple records to the database efficiently
   */
  private async bulkInsert<T extends Object>(
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
}
