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
import { RelationType, Model } from "./model.ts";
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
   * Save model a instance to the database.
   *
   * @param model the model you want to save
   */
  public async save<T extends Object>(model: T): Promise<T>;

  /**
   * Save model instances to the database.
   *
   * @param models the models you want to save
   */
  public async save<T extends Object>(models: T[]): Promise<T[]>;

  /**
   * Save model instance to the database.
   *
   * @param model the model you want to save
   */
  public async save<T extends Object>(model: T | T[]): Promise<T | T[]> {
    if (Array.isArray(model)) {
      const groupedModels = model.reduce((prev, next, index) => {
        const previousModels = prev.get(next.constructor);
        const data = { model: next, index, isSaved: isSaved(next) };
        prev.set(
          next.constructor,
          previousModels ? previousModels.concat(data) : [data],
        );
        return prev;
      }, new Map<Function, { model: T; index: number; isSaved: boolean }[]>());

      await this.adapter.transaction(async () => {
        for (const [key, value] of groupedModels) {
          const insert: T[] = [];

          for (const data of value) {
            !data.isSaved
              ? insert.push(data.model)
              : await this.update(data.model);
          }

          await this.bulkInsert(key, insert);
        }
      });

      return model;
    }

    // If the record is saved, we assume that the user want to update the record.
    // Otherwise, create a new record to the database.
    if (isSaved(model)) {
      await this.update(model);
    } else {
      await this.bulkInsert(model.constructor, [model]);
    }

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
   * Perform update to a model.
   * 
   * @param model the model you want to update.
   */
  private async update<T extends Object>(model: T): Promise<T> {
    const tableName = getTableName(model.constructor);
    const primaryKeyInfo = getPrimaryKeyInfo(model.constructor);
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

      // Save the model's original values
      setSaved(model, true);
    }

    return model;
  }

  /**
   * Insert multiple records to the database efficiently
   */
  private async bulkInsert<T extends Object>(
    modelClass: Function,
    models: T[],
  ): Promise<T[]> {
    const tableName = getTableName(modelClass);
    const primaryKeyInfo = getPrimaryKeyInfo(modelClass);

    // Get all model values
    const values = models.map((model) => {
      const values = getValues(model);

      // If there's a belongs to relationship, add it to the INSERT statement
      for (const relation of getRelationValues(model)) {
        if (relation.description.type === RelationType.BelongsTo) {
          values[relation.description.targetColumn] = relation.value as number;
        }
      }

      return values;
    });

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

    // Assign values to the models
    for (const [index, model] of models.entries()) {
      // Get the models values that has been sent to the database
      // and map column names from `name` to `propertyKey`.
      const value = mapValueProperties(
        model.constructor,
        values[index],
        "propertyKey",
      );

      // Set the primary key
      value[primaryKeyInfo.propertyKey] = ids[index];

      // Populate empty properties with default value
      Object.assign(model, value);

      // If there's a has many relationship, update the foreign key
      for (const relation of getRelationValues(model)) {
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

      // Update the `isSaved` status and save the original values
      setSaved(model, true);
    }

    return models;
  }
}
