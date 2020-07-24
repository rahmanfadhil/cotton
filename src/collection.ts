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
    return this.getPrimaryKeys().length === 0;
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
  public async load(...relations: Extract<keyof T, string>[]): Promise<this> {
    // If the collection is empty, do nothing.
    if (this.isEmpty()) {
      return this;
    }

    // Get the model's table name and primary key name
    const tableName = getTableName(this.modelClass);
    const primaryKeyName = getPrimaryKeyInfo(this.modelClass).name;

    // Initialize the query builder.
    const builder = this.adapter.table(tableName);

    // Select current model columns.
    builder.select(...this.selectModelColumns(this.modelClass));

    // Store all included relationship informations temporarily.
    const includes: {
      type: RelationType;
      modelClass: any;
      propertyKey: string;
    }[] = [];

    // Loop through model relatinships, add left join query to query builder,
    // and append relation information to `includes`.
    for (const relation of getRelations(this.modelClass, relations)) {
      const relationModelClass = relation.getModel();
      const relationTableName = getTableName(relationModelClass);
      const relationPrimaryKeyInfo = getPrimaryKeyInfo(relationModelClass);

      if (relation.type === RelationType.HasMany) {
        builder.leftJoin(
          relationTableName,
          relationTableName + "." + relation.targetColumn,
          tableName + "." + primaryKeyName,
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

    // Perform query. But before that, only select records inside this
    // collection, and order the primary key ascendingly.
    const result = await builder
      .where(primaryKeyName, "in", this.getPrimaryKeys())
      .order(tableName + "." + primaryKeyName, "ASC")
      .execute();

    // Transform the query result to plain JavaScript objects.
    const models = mapQueryResult(
      this.modelClass,
      result,
      includes.map((item) => item.propertyKey),
    );

    // If the number of models from the database is not the same
    // as the collection, throw an error. It means some models
    // has been deleted or the primary key has been changed.
    if (models.length !== this.length) {
      throw new Error(
        `'${this.modelClass.name}' collection content doesn't match with the database!`,
      );
    }

    // Loop through the query result, and plug the relationships to
    // the models inside this collection.
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

    return this;
  }

  // --------------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------------

  /**
   * Get all queryable column names from a model class.
   * 
   * @param modelClass the model class to get the columns
   */
  private selectModelColumns(modelClass: Function): [string, string][] {
    const tableName = getTableName(modelClass);
    const selectColumns = getColumns(modelClass)
      .map((column): [string, string] => [
        tableName + "." + column.name,
        tableName + "__" + column.name,
      ]);
    return selectColumns;
  }
}
