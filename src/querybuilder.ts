import { Adapter } from "./adapters/adapter.ts";
import { QueryCompiler } from "./querycompiler.ts";

/**
 * WHERE operators
 */
export type WhereOperator =
  | ">"
  | ">="
  | "<"
  | "<="
  | "="
  | "!="
  | "like"
  | "in"
  | "between";

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
  operator: WhereOperator;
  value: any;
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
   */
  public where(column: string, value: any): QueryBuilder;
  public where(
    column: string,
    operator: WhereOperator,
    value: any,
  ): QueryBuilder;
  public where(
    column: string,
    operator: WhereOperator,
    value?: any,
  ): QueryBuilder {
    // If the third parameter is undefined, we assume the user want to use the
    // Default operation, which is `=`. Otherwise, it will use the custom
    // operation defined by the user.
    if (typeof value === "undefined") {
      this.addWhereClause({ column, value: operator, type: WhereType.Default });
    } else {
      this.addWhereClause({ column, operator, value, type: WhereType.Default });
    }

    return this;
  }

  /**
   * Add WHERE NOT clause to query
   */
  public not(column: string, value: any): QueryBuilder;
  public not(column: string, operator: WhereOperator, value: any): QueryBuilder;
  public not(
    column: string,
    operator: WhereOperator,
    value?: any,
  ): QueryBuilder {
    // If the third parameter is undefined, we assume the user want to use the
    // Default operation, which is `=`. Otherwise, it will use the custom
    // operation defined by the user.
    if (typeof value === "undefined") {
      this.addWhereClause({ column, value: operator, type: WhereType.Not });
    } else {
      this.addWhereClause({ column, operator, value, type: WhereType.Not });
    }

    return this;
  }

  /**
   * Add WHERE ... OR clause to query
   */
  public or(column: string, value: any): QueryBuilder;
  public or(column: string, operator: WhereOperator, value: any): QueryBuilder;
  public or(
    column: string,
    operator: WhereOperator,
    value?: any,
  ): QueryBuilder {
    // If the third parameter is undefined, we assume the user want to use the
    // Default operation, which is `=`. Otherwise, it will use the custom
    // operation defined by the user.
    if (typeof value === "undefined") {
      this.addWhereClause({ column, value: operator, type: WhereType.Or });
    } else {
      this.addWhereClause({ column, operator, value, type: WhereType.Or });
    }

    return this;
  }

  /**
   * Select table columns
   * 
   * @param columns Table columns to select
   */
  public select(...columns: string[]): QueryBuilder {
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
  public orderBy(
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
  public async execute<T extends {}>(adapter?: Adapter): Promise<T[]> {
    let currentAdapter = adapter || this.adapter;

    if (!currentAdapter) {
      throw new Error("Cannot run query, adapter is not provided!");
    }

    const { text, values } = new QueryCompiler(
      this.description,
      this.adapter.dialect,
    ).compile();

    return await currentAdapter.query(text, values);
  }

  // --------------------------------------------------------------------------------
  // PRIVATE HELPER METHODS
  // --------------------------------------------------------------------------------

  /**
   * Add new where clause to query
   */
  private addWhereClause(
    options: {
      column: string;
      operator?: WhereOperator;
      value: any;
      type: WhereType;
    },
  ) {
    // Populate options with default values
    const clause: WhereBinding = {
      type: options.type,
      column: options.column,
      operator: options.operator || "=",
      value: options.value,
    };

    // Push to `wheres` description
    this.description.wheres.push(clause);
  }
}
