import type {
  Adapter,
  DatabaseResult,
  DatabaseValues,
} from "./adapters/adapter.ts";
import { QueryCompiler } from "./querycompiler.ts";
import { QueryExpression, Q } from "./q.ts";

/**
 * Combine WHERE operators with OR or NOT
 */
export enum WhereType {
  Or = 1,
  Not = 2,
  Default = 3,
}

/**
 * ORDER BY directions
 */
export type OrderDirection = "DESC" | "ASC";

/**
 * WHERE clause informations
 */
export interface WhereBinding {
  column: string;
  expression: QueryExpression;
  type: WhereType;
}

/**
 * ORDER BY clause informations
 */
interface OrderBinding {
  column: string;
  order: OrderDirection;
}

/**
 * Valid query types
 */
export enum QueryType {
  Select = 1,
  Insert = 2,
  Delete = 3,
  Update = 4,
  Replace = 5,
}

export enum JoinType {
  Inner = 1,
  Full = 2,
  Left = 3,
  Right = 4,
}

interface JoinBinding {
  table: string;
  type: JoinType;
  columnA: string;
  columnB: string;
}

export interface CountBinding {
  columns: string[];
  as?: string;
  distinct: boolean;
}

/**
 * Query values for INSERT and UPDATE
 */
export type QueryValues = {
  [key: string]: DatabaseValues;
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
  columns: (string | [string, string])[];

  /** Query values for INSERT and UPDATE */
  values?: QueryValues | QueryValues[];

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

  /** Tables to be joined */
  joins: JoinBinding[];

  /** Count records with given conditions */
  counts: CountBinding[];

  /** Check if the SELECT statement is using DISTINCT keyword */
  isDistinct: boolean;

  /** The having clauses in the query */
  havings: WhereBinding[];

  /** Group records by column */
  groupBy: string[];
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
    private adapter: Adapter,
  ) {
    this.description = {
      tableName,
      type: QueryType.Select,
      columns: [],
      wheres: [],
      orders: [],
      returning: [],
      joins: [],
      counts: [],
      havings: [],
      groupBy: [],
      isDistinct: false,
    };
  }

  // --------------------------------------------------------------------------------
  // PUBLIC QUERY METHODS
  // --------------------------------------------------------------------------------

  /**
   * Add basic WHERE clause to query
   * 
   * @param column the table column name
   * @param value the expected value
   */
  public where(column: string, value: DatabaseValues): QueryBuilder;

  /**
   * Add basic WHERE clause to query with custom query expression.
   * 
   * @param column the table column name
   * @param expresion a custom SQL expression to filter the records
   */
  public where(column: string, expression: QueryExpression): QueryBuilder;

  /** Add basic WHERE clause to query */
  public where(
    column: string,
    expression: DatabaseValues | QueryExpression,
  ): QueryBuilder {
    this.description.wheres.push({
      column,
      expression: expression instanceof QueryExpression
        ? expression
        : Q.eq(expression),
      type: WhereType.Default,
    });

    return this;
  }

  /**
   * Add WHERE NOT clause to query
   * 
   * @param column the table column name
   * @param value the expected value
   */
  public not(column: string, value: DatabaseValues): QueryBuilder;

  /**
   * Add WHERE NOT clause to query with custom query expression.
   * 
   * @param column the table column name
   * @param expresion a custom SQL expression to filter the records
   */
  public not(column: string, expression: QueryExpression): QueryBuilder;

  /** Add WHERE NOT clause to query */
  public not(
    column: string,
    expression: DatabaseValues | QueryExpression,
  ): QueryBuilder {
    this.description.wheres.push({
      column,
      expression: expression instanceof QueryExpression
        ? expression
        : Q.eq(expression),
      type: WhereType.Not,
    });

    return this;
  }

  /**
   * Add WHERE ... OR clause to query
   * 
   * @param column the table column name
   * @param value the expected value
   */
  public or(column: string, value: DatabaseValues): QueryBuilder;

  /**
   * Add WHERE ... OR clause to query with custom query expression.
   * 
   * @param column the table column name
   * @param expresion a custom SQL expression to filter the records
   */
  public or(column: string, expression: QueryExpression): QueryBuilder;

  /** Add WHERE ... OR clause to query */
  public or(
    column: string,
    expression: DatabaseValues | QueryExpression,
  ): QueryBuilder {
    this.description.wheres.push({
      column,
      expression: expression instanceof QueryExpression
        ? expression
        : Q.eq(expression),
      type: WhereType.Or,
    });

    return this;
  }

  /**
   * Select table columns
   * 
   * @param columns table columns to select
   */
  public select(...columns: (string | [string, string])[]): QueryBuilder {
    this.description.columns = this.description.columns.concat(columns);
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
   * @param column Table field
   * @param direction "ASC" or "DESC"
   */
  public order(
    column: string,
    direction: OrderDirection = "ASC",
  ): QueryBuilder {
    this.description.orders.push({ column, order: direction });
    return this;
  }

  /**
   * Add SQL HAVING clause to query
   * 
   * @param column the table column name
   * @param value the expected value
   */
  public having(column: string, value: DatabaseValues): QueryBuilder;

  /**
   * Add SQL HAVING clause to query with custom query expression.
   * 
   * @param column the table column name
   * @param expresion a custom SQL expression to filter the records
   */
  public having(column: string, expression: QueryExpression): QueryBuilder;

  /** Add SQL HAVING clause to query */
  public having(
    column: string,
    expression: DatabaseValues | QueryExpression,
  ): QueryBuilder {
    this.description.havings.push({
      column,
      expression: expression instanceof QueryExpression
        ? expression
        : Q.eq(expression),
      type: WhereType.Default,
    });

    return this;
  }

  /**
   * Group records by a column
   *
   * @param columns the table columns to group
   */
  public groupBy(...columns: string[]) {
    this.description.groupBy = this.description.groupBy.concat(columns);
    return this;
  }

  /**
   * Sets the returning value for the query.
   * 
   * @param columns Table column name
   */
  public returning(...columns: string[]): QueryBuilder {
    this.description.returning = this.description.returning.concat(columns);
    return this;
  }

  // --------------------------------------------------------------------------------
  // CREATE, UPDATE, DELETE
  // --------------------------------------------------------------------------------

  /**
   * Insert a record to the table
   * 
   * @param data A JSON Object representing columnname-value pairs. Example: { firstname: "John", age: 22, ... }
   */
  public insert(data: QueryValues | QueryValues[]): QueryBuilder {
    // Change the query type from `select` (default) to `insert`
    this.description.type = QueryType.Insert;

    // Set the query values
    this.description.values = data;

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
    // Change the query type from `select` (default) to `replace`
    this.description.type = QueryType.Replace;

    // Set the query values
    this.description.values = data;

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

    // Set the query values
    this.description.values = data;

    return this;
  }

  /**
   * Delete record from the database.
   */
  public delete(): QueryBuilder {
    this.description.type = QueryType.Delete;
    return this;
  }

  // --------------------------------------------------------------------------------
  // AGGREGATE
  // --------------------------------------------------------------------------------

  /**
   * Count records with given conditions
   * 
   * @param column the column(s) you want to count
   * @param as the alias for the count result
   */
  public count(column: string | string[], as?: string): QueryBuilder {
    // Initialize the count information
    const info: CountBinding = {
      columns: Array.isArray(column) ? column : [column],
      distinct: false,
    };

    // If the alias of this clause is defined, add it to `info`
    if (typeof as === "string" && as.length >= 1) info.as = as;

    // Add information to the query description
    this.description.counts.push(info);

    return this;
  }

  /**
   * Count records with unique values
   * 
   * @param columns the unique column(s) you want to count
   * @param as the alias for the count result
   */
  public countDistinct(column: string | string[], as?: string): QueryBuilder {
    // Initialize the count information
    const info: CountBinding = {
      columns: Array.isArray(column) ? column : [column],
      distinct: true,
    };

    // If the alias of this clause is defined, add it to `data`
    if (typeof as === "string" && as.length >= 1) info.as = as;

    // Add information to the query description
    this.description.counts.push(info);

    return this;
  }

  /**
   * Force the query to return distinct (unique) results.
   */
  public distinct(): QueryBuilder {
    this.description.isDistinct = true;
    return this;
  }

  // --------------------------------------------------------------------------------
  // JOINS
  // --------------------------------------------------------------------------------

  /** SQL INNER JOIN */
  public innerJoin(table: string, a: string, b: string): QueryBuilder {
    this.description.joins.push({
      type: JoinType.Inner,
      table,
      columnA: a,
      columnB: b,
    });

    return this;
  }

  /** SQL FULL OUTER JOIN */
  public fullJoin(table: string, a: string, b: string): QueryBuilder {
    this.description.joins.push({
      type: JoinType.Full,
      table,
      columnA: a,
      columnB: b,
    });

    return this;
  }

  /** SQL LEFT OUTER JOIN */
  public leftJoin(table: string, a: string, b: string): QueryBuilder {
    this.description.joins.push({
      type: JoinType.Left,
      table,
      columnA: a,
      columnB: b,
    });

    return this;
  }

  /** SQL RIGHT OUTER JOIN */
  public rightJoin(table: string, a: string, b: string): QueryBuilder {
    this.description.joins.push({
      type: JoinType.Right,
      table,
      columnA: a,
      columnB: b,
    });

    return this;
  }

  // --------------------------------------------------------------------------------
  // PERFORM QUERY
  // --------------------------------------------------------------------------------

  /**
   * Execute query and get the result
   * 
   * @param adapter Custom database adapter
   */
  public async execute(adapter?: Adapter): Promise<DatabaseResult[]> {
    let currentAdapter = adapter || this.adapter;

    if (!currentAdapter) {
      throw new Error("Cannot run query, adapter is not provided!");
    }

    const { text, values } = this.toSQL();
    return currentAdapter.query(text, values);
  }

  /**
   * Get the actual SQL query string. All the data are replaced by a placeholder.
   * So, you need to also bind the values in order to execute the query.
   */
  public toSQL() {
    const { text, values } = new QueryCompiler(
      this.description,
      this.adapter.dialect,
    ).compile();
    return { text, values };
  }
}
