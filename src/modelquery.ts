import { QueryBuilder, WhereOperator, OrderDirection } from "./querybuilder.ts";
import { Adapter, DatabaseResult } from "./adapters/adapter.ts";
import {
  getTableName,
  getRelations,
  getColumns,
  getPrimaryKeyInfo,
  createModels,
  mapQueryResult,
  mapSingleQueryResult,
  createModel,
} from "./utils/models.ts";
import { RelationType } from "./model.ts";
import { quote } from "./utils/dialect.ts";

/**
 * Perform query to a model.
 */
export class ModelQuery<T> {
  /** The query builder to construct the query */
  private builder: QueryBuilder;

  /** The table to fetch */
  private tableName: string;

  /** Included relationships */
  private includes: string[] = [];

  // --------------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------------

  /**
   * Create a new model query.
   */
  constructor(private modelClass: { new (): T }, private adapter: Adapter) {
    this.tableName = getTableName(modelClass);
    this.builder = new QueryBuilder(this.tableName, adapter);
    this.selectModelColumns(modelClass);
  }

  // --------------------------------------------------------------------------------
  // QUERY CONSTRAINTS
  // --------------------------------------------------------------------------------

  /**
   * Add basic WHERE clause to query.
   */
  public where(column: keyof T, value: any): this;
  public where(column: keyof T, operator: WhereOperator, value: any): this;
  public where(column: keyof T, operator: WhereOperator, value?: any): this {
    this.builder.where(column as string, operator, value);
    return this;
  }

  /**
   * Add WHERE NOT clause to query.
   */
  public not(column: keyof T, value: any): this;
  public not(column: keyof T, operator: WhereOperator, value: any): this;
  public not(column: keyof T, operator: WhereOperator, value?: any): this {
    this.builder.not(column as string, operator, value);
    return this;
  }

  /**
   * Add WHERE ... OR clause to query.
   */
  public or(column: keyof T, value: any): this;
  public or(column: keyof T, operator: WhereOperator, value: any): this;
  public or(column: keyof T, operator: WhereOperator, value?: any): this {
    this.builder.or(column as string, operator, value);
    return this;
  }

  /**
   * Set the "limit" value for the query.
   * 
   * @param limit maximum number of records
   */
  public limit(limit: number): this {
    this.builder.limit(limit);
    return this;
  }

  /**
   * Set the "offset" value for the query.
   * 
   * @param offset number of records to skip
   */
  public offset(offset: number): this {
    this.builder.offset(offset);
    return this;
  }

  /**
   * Add an "order by" clause to the query.
   * 
   * @param column the table column name
   * @param direction "ASC" or "DESC"
   */
  public order(column: keyof T, direction: OrderDirection = "ASC"): this {
    this.builder.order(column as string, direction);
    return this;
  }

  // --------------------------------------------------------------------------------
  // RELATIONSHIPS
  // --------------------------------------------------------------------------------

  /**
   * Fetch relationships to the query
   * 
   * @param columns all relations you want to include
   */
  public include(...columns: (keyof T)[]): this {
    for (const relation of getRelations(this.modelClass, columns as string[])) {
      const relationTableName = getTableName(relation.getModel());
      const primaryKeyInfo = getPrimaryKeyInfo(this.modelClass);
      const relationPrimaryKeyInfo = getPrimaryKeyInfo(relation.getModel());

      if (relation.type === RelationType.HasMany) {
        this.builder.leftJoin(
          relationTableName,
          relationTableName + "." + relation.targetColumn,
          this.tableName + "." + primaryKeyInfo.name,
        );
      } else if (relation.type === RelationType.BelongsTo) {
        this.builder.leftJoin(
          relationTableName,
          relationTableName + "." + relationPrimaryKeyInfo.name,
          this.tableName + "." + relation.targetColumn,
        );
      }

      this.selectModelColumns(relation.getModel());
      this.includes.push(relation.propertyKey);
    }

    return this;
  }

  // --------------------------------------------------------------------------------
  // FETCH QUERY
  // --------------------------------------------------------------------------------

  /**
   * Get the first record from the query
   */
  public async first(): Promise<T | null> {
    // Check whether this query contains a HasMany relationship
    const isIncludingHasMany = getRelations(this.modelClass, this.includes)
      .find((item) => item.type === RelationType.HasMany);

    let result: DatabaseResult[];

    // If the `includes` option contains a HasMany relationship,
    // we need to get the record primary key first, then, we can fetch
    // the whole data.
    if (isIncludingHasMany) {
      const primaryKeyInfo = getPrimaryKeyInfo(this.modelClass);

      const tableName = getTableName(this.modelClass);

      // Get the distinct query
      const alias = quote("distinctAlias", this.adapter.dialect);
      const primaryColumn = quote(
        tableName + "__" + primaryKeyInfo.name,
        this.adapter.dialect,
      );
      const { text, values } = this.builder.toSQL();
      const queryString = `SELECT DISTINCT ${alias}.${primaryColumn} FROM (${
        text.slice(0, text.length - 1)
      }) ${alias} LIMIT 1;`;

      // Execute the distinct query
      const recordIds = await this.adapter.query(queryString, values);

      // If the record found, fetch the relations
      if (recordIds.length === 1) {
        const id = recordIds[0][tableName + "__" + primaryKeyInfo.name];
        result = await this.builder
          .where(primaryKeyInfo.name, id)
          .execute();
      } else {
        return null;
      }
    } else {
      result = await this.builder.first().execute();
    }

    // Create the model instances
    if (result.length >= 1) {
      const record = this.includes.length >= 1
        ? mapQueryResult(
          this.modelClass,
          result,
          this.includes.length >= 1 ? this.includes : undefined,
        )[0]
        : mapSingleQueryResult(this.modelClass, result[0]);
      return createModel(this.modelClass, record, true);
    } else {
      return null;
    }
  }

  /**
   * Get all records from the query
   */
  public async all(): Promise<T[]> {
    // Execute the query
    const result = await this.builder.execute();

    // Build the model objects
    return createModels(
      this.modelClass,
      mapQueryResult(
        this.modelClass,
        result,
        this.includes.length >= 1 ? this.includes : undefined,
      ),
      true,
    );
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
    this.builder.select(...selectColumns);
  }
}
