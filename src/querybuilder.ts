import { Adapter, DatabaseResult, DatabaseValues } from "./adapters/adapter.ts";
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
interface WhereBinding {
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
  column: string;
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
   * @param columns Table columns to select
   */
  public select(...columns: (string | [string, string])[]): QueryBuilder {
    // Merge the `columns` array with `this.description.columns` without any duplicate.
    columns.forEach((column) => {
      if (!this.description.columns.includes(column)) {
        this.description.columns.push(column);
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

    // Set the query values
    this.description.values = data;

    return this;
  }

  /**
   * Count records with given conditions
   * 
   * @param column the column you want to count
   * @param options count with options
   */
  public count(
    column: string,
    options?: { as?: string; distinct?: boolean },
  ): QueryBuilder {
    this.description.counts.push(Object.assign({}, {
      column,
      distinct: false,
    }, options));
    return this;
  }

  /**
   * Sets the returning value for the query.
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
