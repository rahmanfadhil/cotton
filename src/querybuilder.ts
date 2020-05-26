import { OrderBy, WhereOperators } from "./types.ts";
import { validWhereOperations } from "./constants.ts";
import { BaseAdapter } from "./baseadapter.ts";

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

export class QueryBuilder {
  // --------------------------------------------------------------------------------
  // QUERY CONSTRAINTS
  // --------------------------------------------------------------------------------

  /**
   * Table columns that are going to be fetched
   */
  private columns: string[] = [];

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
    if (typeof value === "undefined") {
      this.addWhereClause(fieldName, "=", operator);
    } else {
      if (!validWhereOperations.includes(operator)) {
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
   * Generate executable SQL query string
   */
  public toSQL(): string {
    // Initial query
    let query: string[] = [`SELECT * FROM ${this.tableName}`];

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
    let cleanedValue: string = "";

    if (typeof value === "string") {
      // TODO: Sanitize value to prevent SQL injection
      cleanedValue = `'${value}'`;
    }

    if (typeof value === "boolean") {
      cleanedValue = value ? "1" : "0";
    }

    if (typeof value === "number") {
      cleanedValue = value.toString();
    }

    this.wheres.push({ fieldName, operator, value: cleanedValue });
  }
}
