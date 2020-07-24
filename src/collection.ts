import {
  getPrimaryKeyInfo,
  isSaved,
  getRelations,
  getTableName,
  getColumns,
  createModels,
  mapQueryResult,
  createModel,
} from "./utils/models.ts";
import { RelationType } from "./model.ts";
import { Adapter } from "./adapters/adapter.ts";

/**
 * A collection of models.
 */
export class Collection<T> extends Array<T> {
  /**
   * The model class of this collection.
   */
  private modelClass: { new (): T };

  /**
   * The database adapter to perform queries.
   */
  private adapter: Adapter;

  /**
   * Create a new model collection.
   * 
   * @param adapter the database adapter to perform queries
   * @param modelClass the model class of this collection
   * @param items the models inside this class
   */
  constructor(adapter: Adapter, modelClass: { new (): T }, ...items: T[]) {
    super(...items);
    this.adapter = adapter;
    this.modelClass = modelClass;
  }

  /**
   * Check if this collection has nothing in it.
   */
  public isEmpty() {
    return this.length === 0;
  }

  /**
   * Get all primary keys inside this collection.
   */
  public getPrimaryKeys(): number[] {
    const primaryKeyInfo = getPrimaryKeyInfo(this.modelClass);
    const ids: number[] = [];

    // If the model is saved and has an primary key, append to `ids`
    for (const model of this) {
      if (isSaved(model) && (model as any)[primaryKeyInfo.propertyKey]) {
        ids.push((model as any)[primaryKeyInfo.propertyKey]);
      } else {
        throw new Error(
          `Unsaved model found in '${this.modelClass.name}' collection!`,
        );
      }
    }

    return ids;
  }

  /**
   * Load model relations.
   */
  public async load(...relations: Extract<keyof T, string>[]) {
    const tableName = getTableName(this.modelClass);
    const primaryKeyName = getPrimaryKeyInfo(this.modelClass).name;

    const builder = this.adapter.table(tableName);
    builder.select(...this.selectModelColumns(this.modelClass));

    const includes: {
      type: RelationType;
      modelClass: any;
      propertyKey: string;
    }[] = [];

    for (const relation of getRelations(this.modelClass, relations)) {
      const relationModelClass = relation.getModel();
      const relationTableName = getTableName(relationModelClass);
      const primaryKeyInfo = getPrimaryKeyInfo(this.modelClass);
      const relationPrimaryKeyInfo = getPrimaryKeyInfo(relationModelClass);

      if (relation.type === RelationType.HasMany) {
        builder.leftJoin(
          relationTableName,
          relationTableName + "." + relation.targetColumn,
          tableName + "." + primaryKeyInfo.name,
        );
      } else if (relation.type === RelationType.BelongsTo) {
        builder.leftJoin(
          relationTableName,
          relationTableName + "." + relationPrimaryKeyInfo.name,
          tableName + "." + relation.targetColumn,
        );
      }

      includes.push({
        type: relation.type,
        modelClass: relationModelClass,
        propertyKey: relation.propertyKey,
      });
      builder.select(...this.selectModelColumns(relationModelClass));
    }

    const result = await builder
      .where(primaryKeyName, "in", this.getPrimaryKeys())
      .order(tableName + "." + primaryKeyName, "ASC")
      .execute();

    const models = mapQueryResult(
      this.modelClass,
      result,
      includes.map((item) => item.propertyKey),
    );

    if (models.length !== this.length) {
      throw new Error(
        `'${this.modelClass.name}' collection content doesn't match with the database!`,
      );
    }

    for (let i = 0; i < models.length; i++) {
      for (const relation of includes) {
        let relationData: any;

        if (relation.type === RelationType.HasMany) {
          const data = createModels(
            relation.modelClass,
            (models[i] as any)[relation.propertyKey],
            true,
          );
          relationData = new Collection(
            this.adapter,
            relation.modelClass,
            ...data,
          );
        } else if (relation.type === RelationType.BelongsTo) {
          if ((models[i] as any)[relation.propertyKey]) {
            relationData = createModel(
              relation.modelClass,
              (models[i] as any)[relation.propertyKey],
              true,
            );
          }
        }

        (this[i] as any)[relation.propertyKey] = relationData;
      }
    }
  }

  // --------------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------------

  /**
   * Select all columns of a model class.
   * 
   * @param modelClass the model class to get the columns
   */
  private selectModelColumns(modelClass: Function) {
    const tableName = getTableName(modelClass);
    const selectColumns = getColumns(modelClass)
      .map((column): [string, string] => [
        tableName + "." + column.name,
        tableName + "__" + column.name,
      ]);
    return selectColumns;
  }
}
