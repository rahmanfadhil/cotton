import { QueryBuilder, OrderDirection } from "./querybuilder.ts";
import type {
  Adapter,
  DatabaseResult,
  DatabaseValues,
} from "./adapters/adapter.ts";
import {
  getTableName,
  getRelations,
  getColumns,
  getPrimaryKeyInfo,
  createModels,
  mapQueryResult,
  mapSingleQueryResult,
  createModel,
  findColumn,
  mapValueProperties,
} from "./utils/models.ts";
import { RelationType } from "./model.ts";
import { quote } from "./utils/dialect.ts";
import type { DeepPartial } from "./manager.ts";
import { QueryExpression, Q } from "./q.ts";

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
  }

  // --------------------------------------------------------------------------------
  // QUERY CONSTRAINTS
  // --------------------------------------------------------------------------------

  /**
   * Add basic WHERE clause to query.
   * 
   * @param column the table column name
   * @param value the expected value
   */
  public where(column: string, value: DatabaseValues): this;

  /**
   * Add basic WHERE clause to query with custom query expression.
   * 
   * @param column the table column name
   * @param expresion a custom SQL expression to filter the records
   */
  public where(column: string, expression: QueryExpression): this;

  /** Add basic WHERE clause to query */
  public where(
    column: string,
    expression: DatabaseValues | QueryExpression,
  ): this {
    this.builder.where(
      this.getColumnName(column),
      expression as DatabaseValues,
    );
    return this;
  }

  /**
   * Add WHERE NOT clause to query.
   * 
   * @param column the table column name
   * @param value the expected value
   */
  public not(column: string, value: DatabaseValues): this;

  /**
   * Add WHERE NOT clause to query with custom query expression.
   * 
   * @param column the table column name
   * @param expresion a custom SQL expression to filter the records
   */
  public not(column: string, expression: QueryExpression): this;

  /** Add WHERE NOT clause to query. */
  public not(
    column: string,
    expression: DatabaseValues | QueryExpression,
  ): this {
    this.builder.not(this.getColumnName(column), expression as DatabaseValues);
    return this;
  }

  /**
   * Add WHERE ... OR clause to query.
   * 
   * @param column the table column name
   * @param value the expected value
   */
  public or(column: string, value: DatabaseValues): this;

  /**
   * Add WHERE ... OR clause to query with custom query expression.
   * 
   * @param column the table column name
   * @param expresion a custom SQL expression to filter the records
   */
  public or(column: string, expression: QueryExpression): this;

  /** Add WHERE ... OR clause to query. */
  public or(
    column: string,
    expression: DatabaseValues | QueryExpression,
  ): this {
    this.builder.or(this.getColumnName(column), expression as DatabaseValues);
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
  public order(
    column: Extract<keyof T, string>,
    direction?: OrderDirection,
  ): this {
    this.builder.order(this.getColumnName(column as string), direction);
    return this;
  }

  // --------------------------------------------------------------------------------
  // RELATIONSHIPS
  // --------------------------------------------------------------------------------

  /**
   * Fetch relationships to the query.
   * 
   * @param columns all relations you want to include
   */
  public include(...columns: (Extract<keyof T, string>)[]): this {
    for (const relation of getRelations(this.modelClass, columns)) {
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
   * Count models with given conditions.
   */
  public async count(): Promise<number> {
    const primaryKeyInfo = getPrimaryKeyInfo(this.modelClass);
    const result = await this.builder
      .countDistinct(primaryKeyInfo.name, "count")
      .execute();
    return Number(result[0].count) as number || 0;
  }

  /**
   * Update models with given conditions.
   * 
   * @param data the new data you want to update
   */
  public async update(data: DeepPartial<T>): Promise<void> {
    const values = mapValueProperties(this.modelClass, data as any, "name");
    await this.builder.update(values).execute();
  }

  /**
   * Delete models with given conditions.
   */
  public async delete(): Promise<void> {
    await this.builder.delete().execute();
  }

  /**
   * Find a single record that match given conditions. If multiple
   * found, it will return the first one. 
   */
  public async first(): Promise<T | null> {
    // Select model columns
    this.selectModelColumns(this.modelClass);

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
          .where(primaryKeyInfo.name, Q.eq(id))
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
   * Find records that match given conditions.
   */
  public async all(): Promise<T[]> {
    // Select model columns
    this.selectModelColumns(this.modelClass);

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
    const columns = getColumns(modelClass)
      .map((column): [string, string] => [
        tableName + "." + column.name,
        tableName + "__" + column.name,
      ]);
    this.builder.select(...columns);
  }

  /**
   * Get column name on the database from a column property key.
   * 
   * @param propertyKey the property key of the column
   */
  private getColumnName(propertyKey: string): string {
    const column = findColumn(this.modelClass, propertyKey);

    if (!column) {
      throw new Error(
        `Column '${propertyKey}' doesn't exist in model '${this.modelClass.name}'!`,
      );
    }

    return column.name;
  }
}
