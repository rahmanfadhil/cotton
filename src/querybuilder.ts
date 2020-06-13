import { VALID_WHERE_OPERATIONS } from "./constants.ts";
import { Adapter, QueryOptions, QueryResult } from "./adapters/adapter.ts";
import { DateUtils } from "./utils/date.ts";

/**
 * WHERE operators
 */
export type WhereOperator = ">" | ">=" | "<" | "<=" | "=" | "like";

/**
 * Combine WHERE operators with OR or NOT
 */
export enum WhereType {
  OR = "OR",
  NOT = "NOT",
}

/**
 * ORDER BY directions
 */
export type OrderDirection = "DESC" | "ASC";

/**
 * WHERE clause informations
 */
interface WhereBinding {
  fieldName: string;
  operator: WhereOperator;
  value: any;
  type?: WhereType;
}

/**
 * ORDER BY clause informations
 */
interface OrderBinding {
  fieldName: string;
  order: OrderDirection;
}

/**
 * Valid query types
 */
enum QueryType {
  Select = "select",
  Insert = "insert",
  Delete = "delete",
  Update = "update",
  Replace = "replace",
}

/**
 * Query values for INSERT and UPDATE
 */
export type QueryValues = {
  [key: string]: number | string | boolean | Date;
};

/**
 * All information about the query
 */
export interface QueryDescription {
  /** The table which the query is targeting */
  tableName: string;

  /** Query type */
  type: QueryType;

  /** Table columns that are going to be fetched */
  columns: string[];

  /** Query values for INSERT and UPDATE */
  values?: QueryValues;

  /** The where constraints of the query */
  wheres: WhereBinding[];

  /** The orderings for the query */
  orders: OrderBinding[];

  /** The maximum number of records to return */
  limit?: number;

  /** The number of records to skip */
  offset?: number;

  /** Values to be returned by the query */
  returning: string[];
}

/**
 * Allows to build complex SQL queries and execute those queries.
 */
export class QueryBuilder {
  private description: QueryDescription;

  // --------------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------------

  constructor(
    /** The table which the query is targeting */
    tableName: string,
    /** The database adapter to perform query */
    private adapter?: Adapter,
  ) {
    this.description = {
      tableName,
      type: QueryType.Select,
      columns: [],
      wheres: [],
      orders: [],
      returning: [],
    };
  }

  // --------------------------------------------------------------------------------
  // PUBLIC QUERY METHODS
  // --------------------------------------------------------------------------------

  /**
   * Insert a record to the table
   * 
   * @param data A JSON Object representing columnname-value pairs. Example: { firstname: "John", age: 22, ... }
   */
  public insert(data: QueryValues): QueryBuilder {
    // Change the query type from `select` (default) to `insert`
    this.description.type = QueryType.Insert;

    // Throw an error if the data is not provided
    if (!data) {
      throw new Error("Cannot perform insert query without values!");
    }

    // Holds the cleaned data
    let cleanedData: QueryValues = {};

    // Transform values to the format that the database can understand and store it to `cleanedData`
    for (const [key, value] of Object.entries(data)) {
      cleanedData[key] = this.toDatabaseValue(value);
    }

    this.description.values = cleanedData;

    return this;
  }

  /**
   * Perform `REPLACE` query to the table.
   * 
   * It will look for `PRIMARY` and `UNIQUE` constraints.
   * If something matched, it gets removed from the table
   * and creates a new row with the given values.
   * 
   * @param data A JSON Object representing columnname-value pairs. Example: { firstname: "John", age: 22, ... }
   */
  public replace(data: QueryValues): QueryBuilder {
    // Change the query type from `select` (default) to `insert`
    this.description.type = QueryType.Replace;

    // Holds the cleaned data
    let cleanedData: QueryValues = {};

    // Transform values to the format that the database can understand and store it to `cleanedData`
    for (const [key, value] of Object.entries(data)) {
      cleanedData[key] = this.toDatabaseValue(value);
    }

    this.description.values = cleanedData;

    return this;
  }

  /**
   * Add basic WHERE clause to query
   */
  public where(fieldName: string, value: any): QueryBuilder;
  public where(
    fieldName: string,
    operator: WhereOperator,
    value: any,
  ): QueryBuilder;
  public where(
    fieldName: string,
    operator: WhereOperator,
    value?: any,
  ): QueryBuilder {
    // If the third parameter is undefined, we assume the user want to use the
    // Default operation, which is `=`. Otherwise, it will use the custom
    // operation defined by the user.
    if (typeof value === "undefined") {
      this.addWhereClause({ fieldName, value: operator });
    } else {
      this.addWhereClause({ fieldName, operator, value });
    }

    return this;
  }

  /**
   * Add WHERE NOT clause to query
   */
  public notWhere(fieldName: string, value: any): QueryBuilder;
  public notWhere(
    fieldName: string,
    operator: WhereOperator,
    value: any,
  ): QueryBuilder;
  public notWhere(
    fieldName: string,
    operator: WhereOperator,
    value?: any,
  ): QueryBuilder {
    // If the third parameter is undefined, we assume the user want to use the
    // Default operation, which is `=`. Otherwise, it will use the custom
    // operation defined by the user.
    if (typeof value === "undefined") {
      this.addWhereClause({ fieldName, value: operator, type: WhereType.NOT });
    } else {
      this.addWhereClause({ fieldName, operator, value, type: WhereType.NOT });
    }

    return this;
  }

  /**
   * Add WHERE ... OR clause to query
   */
  public orWhere(fieldName: string, value: any): QueryBuilder;
  public orWhere(
    fieldName: string,
    operator: WhereOperator,
    value: any,
  ): QueryBuilder;
  public orWhere(
    fieldName: string,
    operator: WhereOperator,
    value?: any,
  ): QueryBuilder {
    // If the third parameter is undefined, we assume the user want to use the
    // Default operation, which is `=`. Otherwise, it will use the custom
    // operation defined by the user.
    if (typeof value === "undefined") {
      this.addWhereClause({ fieldName, value: operator, type: WhereType.OR });
    } else {
      this.addWhereClause({ fieldName, operator, value, type: WhereType.OR });
    }

    return this;
  }

  /**
   * Select table fields
   * 
   * @param fields Table fields to select
   */
  public select(...fields: string[]): QueryBuilder {
    // Merge the `fields` array with `this.description.columns` without any duplicate.
    fields.forEach((item) => {
      if (!this.description.columns.includes(item)) {
        this.description.columns.push(item);
      }
    });

    return this;
  }

  /**
   * Set the "limit" value for the query.
   * 
   * @param limit Maximum number of records
   */
  public limit(limit: number): QueryBuilder {
    if (limit >= 0) {
      this.description.limit = limit;
    }

    return this;
  }

  /**
   * Set the "offset" value for the query.
   * 
   * @param offset Numbers of records to skip
   */
  public offset(offset: number): QueryBuilder {
    if (offset > 0) {
      this.description.offset = offset;
    }
    return this;
  }

  /**
   * Get the first record of the query, shortcut for `limit(1)`
   */
  public first(): QueryBuilder {
    return this.limit(1);
  }

  /**
   * Add an "order by" clause to the query.
   * 
   * @param fieldName Table field
   * @param direction "ASC" or "DESC"
   */
  public orderBy(
    fieldName: string,
    direction: OrderDirection = "ASC",
  ): QueryBuilder {
    this.description.orders.push({ fieldName, order: direction });
    return this;
  }

  /**
   * Delete record from the database.
   */
  public delete(): QueryBuilder {
    this.description.type = QueryType.Delete;
    return this;
  }

  /**
   * Update record on the database
   * 
   * @param data A JSON Object representing columnname-value pairs. Example: { firstname: "John", age: 22, ... }
   */
  public update(data: QueryValues): QueryBuilder {
    // Change the query type from `select` (default) to `update`
    this.description.type = QueryType.Update;

    // Throw an error if the data is not provided
    if (!data) {
      throw new Error("Cannot perform update query without values!");
    }

    // Holds the cleaned data
    let cleanedData: QueryValues = {};

    // Transform values to the format that the database can understand and store it to `cleanedData`
    for (const [key, value] of Object.entries(data)) {
      cleanedData[key] = this.toDatabaseValue(value);
    }

    this.description.values = cleanedData;

    return this;
  }

  /**
   * Sets the returning value for the query.
   * 
   * TODO: check if the database supports RETURNING (mysql and sqlite doesn't support it)
   * 
   * @param columns Table column name
   */
  public returning(...columns: string[]): QueryBuilder {
    // Merge the `columns` array with `this.description.returning` without any duplicate.
    columns.forEach((item) => {
      if (!this.description.returning.includes(item)) {
        this.description.returning.push(item);
      }
    });

    return this;
  }

  // --------------------------------------------------------------------------------
  // GENERATE QUERY STRING
  // --------------------------------------------------------------------------------

  /**
   * Generate executable SQL statement
   */
  public toSQL(): string {
    switch (this.description.type) {
      case QueryType.Select:
        return this.toSelectSQL();
      case QueryType.Insert:
        return this.toInsertSQL();
      case QueryType.Replace:
        return this.toReplaceSQL();
      case QueryType.Update:
        return this.toUpdateSQL();
      case QueryType.Delete:
        return this.toDeleteSQL();
      default:
        throw new Error(`Query type '${this.description.type}' is invalid!`);
    }
  }

  /**
   * Generate `UPDATE` query string
   */
  private toUpdateSQL(): string {
    let query: string[] = [`UPDATE ${this.description.tableName} SET`];

    if (this.description.values) {
      const values = [];
      for (const [key, value] of Object.entries(this.description.values)) {
        values.push(`${key} = ${value}`);
      }
      query.push(values.join(", "));
    } else {
      throw new Error("Cannot perform insert query without values!");
    }

    if (this.description.returning.length > 0) {
      query.push("RETURNING", this.description.returning.join(", "));
    }

    // Add all query constraints
    query = query.concat(this.collectConstraints());

    return query.join(" ") + ";";
  }

  /**
   * Generate `INSERT` query string
   */
  private toInsertSQL(): string {
    // Query strings
    let query: string[] = [`INSERT INTO ${this.description.tableName}`];

    if (this.description.values) {
      const fields = `(${Object.keys(this.description.values).join(", ")})`;
      const values = `(${Object.values(this.description.values).join(", ")})`;
      query.push(fields, "VALUES", values);
    } else {
      throw new Error("Cannot perform insert query without values!");
    }

    if (this.description.returning.length > 0) {
      query.push("RETURNING", this.description.returning.join(", "));
    }

    return query.join(" ") + ";";
  }

  /**
   * Generate `REPLACE` query string
   */
  private toReplaceSQL(): string {
    // Query strings
    let query: string[] = [`REPLACE INTO ${this.description.tableName}`];

    if (
      this.description.values
    ) {
      // Only call Object.keys once for performance reasons(this function can get really slow on bigger Objects)
      let keys = Object.keys(this.description.values);
      if (keys.length >= 1) {
        const fields = `(${keys.join(", ")})`;
        const values = `(${Object.values(this.description.values).join(", ")})`;
        query.push(fields, "VALUES", values);
      } else {
        throw new Error("Cannot perform replace query without values!");
      }
    } else {
      // This is probably redundant and will never be triggered,
      // because insert() will throw a default error if the type is not matching.
      throw new TypeError("Cannot perform replace with undefined Parameters!");
    }

    if (this.description.returning.length > 0) {
      query.push("RETURNING", this.description.returning.join(", "));
    }

    return query.join(" ") + ";";
  }

  /**
   * Generate `SELECT` query string
   */
  private toSelectSQL(): string {
    // Query strings
    let query: string[] = [`SELECT`];

    // Select table columns
    if (this.description.columns.length > 0) {
      query.push(`(${this.description.columns.join(", ")})`);
    } else {
      query.push("*");
    }

    // Add table name
    query.push(`FROM ${this.description.tableName}`);

    // Add all query constraints
    query = query.concat(this.collectConstraints());

    return query.join(" ") + ";";
  }

  /**
   * Generate `DELETE` query string
   */
  private toDeleteSQL(): string {
    // Query strings
    let query: string[] = [`DELETE FROM ${this.description.tableName}`];

    // Add all query constraints
    query = query.concat(this.collectConstraints());

    return query.join(" ") + ";";
  }

  /**
   * Collect query constraints in the current query
   * 
   * Example result:
   * 
   * ```
   * ["WHERE email = 'a@b.com'", "LIMIT 1"]
   * ```
   */
  private collectConstraints(): string[] {
    // Query strings (that contain constraints only)
    let query: string[] = [];

    // Add where clauses if exists
    if (this.description.wheres.length > 0) {
      for (let index = 0; index < this.description.wheres.length; index++) {
        const whereClause = this.description.wheres[index];

        if (index === 0) {
          // The first where clause should have `WHERE` explicitly.
          if (whereClause.type === WhereType.NOT) {
            query.push(
              `WHERE NOT ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
            );
          } else {
            query.push(
              `WHERE ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
            );
          }
        } else {
          // The rest of them use `AND`
          switch (whereClause.type) {
            case WhereType.NOT:
              query.push(
                `AND NOT ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
              );
              break;
            case WhereType.OR:
              query.push(
                `OR ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
              );
              break;
            default:
              query.push(
                `AND ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
              );
              break;
          }
        }
      }
    }

    // Add "order by" clauses
    if (this.description.orders.length > 0) {
      query.push(`ORDER BY`);

      query.push(
        this.description.orders
          .map((order) => `${order.fieldName} ${order.order}`)
          .join(", "),
      );
    }

    // Add query limit if exists
    if (this.description.limit && this.description.limit > 0) {
      query.push(`LIMIT ${this.description.limit}`);
    }

    // Add query offset if exists
    if (this.description.offset && this.description.offset > 0) {
      query.push(`OFFSET ${this.description.offset}`);
    }

    return query;
  }

  // --------------------------------------------------------------------------------
  // PERFORM QUERY
  // --------------------------------------------------------------------------------

  /**
   * Execute query and get the result
   * 
   * @param adapter Custom database adapter
   */
  public async execute(
    options?: { adapter?: Adapter } & QueryOptions,
  ): Promise<QueryResult<any>> {
    let currentAdapter = options?.adapter || this.adapter;

    if (!currentAdapter) {
      throw new Error("Cannot run query, adapter is not provided!");
    }

    return await currentAdapter.query(this.toSQL(), options);
  }

  // --------------------------------------------------------------------------------
  // PRIVATE HELPER METHODS
  // --------------------------------------------------------------------------------

  /**
   * Add new where clause to query
   */
  private addWhereClause(
    options: {
      fieldName: string;
      operator?: WhereOperator;
      value: any;
      type?: WhereType;
    },
  ) {
    // Populate options with default values
    const { fieldName, operator, value, type } = Object.assign(
      {},
      { operator: "=" },
      options,
    );

    // Check wether the custom WHERE operation is valid
    if (!VALID_WHERE_OPERATIONS.includes(operator)) {
      throw new Error("Invalid operation!");
    }

    // Push to `wheres` description
    this.description.wheres.push({
      fieldName,
      operator,
      type,
      value: this.toDatabaseValue(value),
    });
  }

  /**
   * Transform value to a format that the database can understand
   * 
   * @param value The value to be sanitized
   * 
   * TODO: Sanitize value to prevent SQL injection
   */
  private toDatabaseValue(value: any): string {
    let cleanedValue = "";

    if (typeof value === "string") {
      cleanedValue = `'${value}'`;
    }

    if (typeof value === "boolean") {
      cleanedValue = value ? "1" : "0";
    }

    if (typeof value === "number") {
      cleanedValue = value.toString();
    }

    if (value instanceof Date) {
      cleanedValue = `'${DateUtils.formatDate(value)}'`;
    }

    return cleanedValue;
  }
}
