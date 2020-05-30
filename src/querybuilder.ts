import { OrderBy, WhereOperators } from "./types.ts";
import { VALID_WHERE_OPERATIONS } from "./constants.ts";
import { BaseAdapter } from "./baseadapter.ts";
import { DateUtils } from "./utils/date.ts";

/**
 * WHERE clause informations
 */
interface WhereBinding {
  fieldName: string;
  operator: WhereOperators;
  value: any;
}

/**
 * ORDER BY clause informations
 */
interface OrderBinding {
  fieldName: string;
  order: OrderBy;
}

enum QueryType {
  Select = "select",
  Insert = "insert",
}

export type QueryValues = { [key: string]: number | string | boolean | Date };

/**
 * Allows to build complex SQL queries and execute those queries.
 */
export class QueryBuilder {
  // --------------------------------------------------------------------------------
  // QUERY CONSTRAINTS
  // --------------------------------------------------------------------------------

  /**
   * Query type
   */
  private type: QueryType = QueryType.Select;

  /**
   * Table columns that are going to be fetched
   */
  private columns: string[] = [];

  /**
   * Query values for INSERT and UPDATE
   */
  private values: QueryValues;

  /**
   * The where constraints of the query
   */
  private wheres: WhereBinding[] = [];

  /**
   * The orderings for the query. 
   */
  private orders: OrderBinding[] = [];

  /**
   * The maximum number of records to return
   */
  private queryLimit?: number;

  /**
   * The number of records to skip
   */
  private queryOffset?: number;

  // --------------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------------

  constructor(
    /** The table which the query is targeting */
    private tableName: string,
    /** The database adapter to perform query */
    private adapter?: BaseAdapter,
  ) {}

  // --------------------------------------------------------------------------------
  // PUBLIC QUERY METHODS
  // --------------------------------------------------------------------------------

  public insert(data: QueryValues): QueryBuilder {
    // Change the query type from `select` (default) to `insert`
    this.type = QueryType.Insert;

    // Holds the cleaned data
    let cleanedData: QueryValues = {};

    // Transform values to the format that the database can understand and store it to `cleanedData`
    for (const [key, value] of Object.entries(data)) {
      cleanedData[key] = this.toDatabaseValue(value);
    }

    this.values = cleanedData;

    return this;
  }

  /**
   * Add basic where clause to query
   */
  public where(fieldName: string, value: any): QueryBuilder;
  public where(
    fieldName: string,
    operator: WhereOperators,
    value: any,
  ): QueryBuilder;
  public where(
    fieldName: string,
    operator: WhereOperators,
    value?: any,
  ): QueryBuilder {
    // If the third parameter is undefined, we assume the user want to use the
    // Default operation, which is `=`. Otherwise, it will use the custom
    // operation defined by the user.
    if (typeof value === "undefined") {
      this.addWhereClause(fieldName, "=", operator);
    } else {
      // Check wether the custom WHERE operation is valid
      if (!VALID_WHERE_OPERATIONS.includes(operator)) {
        throw new Error("Invalid operation!");
      } else {
        this.addWhereClause(fieldName, operator, value);
      }
    }

    return this;
  }

  public select(...fields: string[]): QueryBuilder {
    // Merge the `fields` array with `this.columns` without any duplicate.
    if (Array.isArray(fields)) {
      fields.forEach((item) => {
        if (!this.columns.includes(item)) {
          this.columns.push(item);
        }
      });
    }

    return this;
  }

  /**
   * Set the "limit" value for the query.
   * 
   * @param limit maximum number of records
   */
  public limit(limit: number): QueryBuilder {
    if (limit >= 0) {
      this.queryLimit = limit;
    }

    return this;
  }

  /**
   * Set the "offset" value for the query.
   * 
   * @param offset numbers of records to skip
   */
  public offset(offset: number): QueryBuilder {
    if (offset > 0) {
      this.queryOffset = offset;
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
  public orderBy(fieldName: string, direction: OrderBy = "ASC"): QueryBuilder {
    this.orders.push({ fieldName, order: direction });
    return this;
  }

  // --------------------------------------------------------------------------------
  // GENERATE QUERY STRING
  // --------------------------------------------------------------------------------

  /**
   * Generate executable SQL statement
   */
  public toSQL(): string {
    switch (this.type) {
      case QueryType.Select:
        return this.toSelectSQL();
      case QueryType.Insert:
        return this.toInsertSQL();
      default:
        throw new Error(`Query type '${this.type}' is invalid!`);
    }
  }

  /**
   * Generate `INSERT` query string
   */
  private toInsertSQL(): string {
    // Initial query
    let query: string[] = [`INSERT INTO ${this.tableName}`];

    if (this.values) {
      const fields = `(${Object.keys(this.values).join(", ")})`;
      const values = `(${Object.values(this.values).join(", ")})`;
      query.push(fields, "VALUES", values);
    } else {
      throw new Error("Cannot perform insert query without values!");
    }

    return query.join(" ") + ";";
  }

  /**
   * Generate `SELECT` query string
   */
  private toSelectSQL(): string {
    // Initial query
    let query: string[] = [`SELECT`];

    // Select table columns
    if (this.columns.length > 0) {
      query.push(`(${this.columns.join(", ")})`);
    } else {
      query.push("*");
    }

    // Add table name
    query.push(`FROM ${this.tableName}`);

    // Add where clauses if exists
    if (this.wheres.length > 0) {
      for (let index = 0; index < this.wheres.length; index++) {
        const whereClause = this.wheres[index];

        if (index === 0) { // The first where clause should have `WHERE` explicitly
          query.push(
            `WHERE ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
          );
        } else { // The rest of them use `AND`
          query.push(
            `AND ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
          );
        }
      }
    }

    // Add "order by" clauses
    if (this.orders.length > 0) {
      query.push(`ORDER BY`);

      query.push(
        this.orders
          .map((order) => `${order.fieldName} ${order.order}`)
          .join(", "),
      );
    }

    // Add query limit if exists
    if (this.queryLimit && this.queryLimit > 0) {
      query.push(`LIMIT ${this.queryLimit}`);
    }

    // Add query offset if exists
    if (this.queryOffset && this.queryOffset > 0) {
      query.push(`OFFSET ${this.queryOffset}`);
    }

    return query.join(" ") + ";";
  }

  // --------------------------------------------------------------------------------
  // PERFORM QUERY
  // --------------------------------------------------------------------------------

  /**
   * Execute query and get the result
   * 
   * @param adapter Custom database adapter
   */
  public async execute(adapter?: BaseAdapter): Promise<any[]> {
    let queryResult: any[];

    // If user pass a custom adapter, use the it. Otherwise, use the default adapter from the class.
    if (adapter !== undefined) {
      queryResult = await adapter.query(this.toSQL());
    } else if (this.adapter) {
      queryResult = await this.adapter.query(this.toSQL());
    } else {
      // TODO: improve error message
      throw new Error("Adapter is not provided!");
    }

    return queryResult;
  }

  // --------------------------------------------------------------------------------
  // PRIVATE HELPER METHODS
  // --------------------------------------------------------------------------------

  /**
   * Add new where clause to query
   */
  private addWhereClause(
    fieldName: string,
    operator: WhereOperators,
    value: any,
  ) {
    this.wheres.push({
      fieldName,
      operator,
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
