import { COLUMN_TYPES } from "../constants.ts";
import { ColumnDefinition } from "./columndefinition.ts";
import { Adapter } from "../adapters/adapter.ts";

export interface CreateTableOptions {
  createIfNotExists?: boolean;
}

export interface ColumnOptions {
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
}

/**
 * The table builder
 */
export class TableBuilder {
  private options: Required<CreateTableOptions>;
  private columns: ColumnDefinition[] = [];

  constructor(
    /** Table name on the database */
    private tableName: string,
    /** The database adapter */
    private adapter: Adapter,
    /** Other options */
    options?: CreateTableOptions,
  ) {
    // Populate `this.options` with default
    this.options = Object.assign({}, { createIfNotExists: false }, options);
  }

  // --------------------------------------------------------------------------------
  // AUTO INCREMENTAL
  // --------------------------------------------------------------------------------

  /** Add an auto incremented integer column */
  public id() {
    this.increments("id", { primaryKey: true });
  }

  public increments(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "increments", name: column, ...options });
  }

  /** Add a big auto incremented integer column */
  public bigIncrements(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "bigIncrements", name: column, ...options });
  }

  /** Add a small auto incremented integer column */
  public smallIncrements(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "smallIncrements", name: column, ...options });
  }

  // --------------------------------------------------------------------------------
  // TEXT
  // --------------------------------------------------------------------------------

  /** Add a varchar column */
  public string(column: string, size?: number, options?: ColumnOptions) {
    this.columns.push({ type: "varchar", size, name: column, ...options });
  }

  /** Add a large text column */
  public text(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "text", name: column, ...options });
  }

  // --------------------------------------------------------------------------------
  // INTEGER
  // --------------------------------------------------------------------------------

  /** Add an integer column */
  public integer(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "integer", name: column, ...options });
  }

  /** Add a big integer column */
  public bigInteger(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "bigInteger", name: column, ...options });
  }

  /** Add a small integer column */
  public smallInteger(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "smallInteger", name: column, ...options });
  }

  // --------------------------------------------------------------------------------
  // DATE & TIME
  // --------------------------------------------------------------------------------

  /** Add a datetime column */
  public datetime(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "dateTime", name: column, ...options });
  }

  /** Record timestamps when creation and update */
  public timestamps() {
    this.columns.push({ name: "created_at", type: "dateTime" });
    this.columns.push({ name: "updated_at", type: "dateTime" });
  }

  // --------------------------------------------------------------------------------
  // OTHER COLUMN TYPES
  // --------------------------------------------------------------------------------

  /** Add a boolean column */
  public boolean(column: string, options?: ColumnOptions) {
    this.columns.push({ type: "boolean", name: column, ...options });
  }

  // --------------------------------------------------------------------------------
  // SQL QUERY
  // --------------------------------------------------------------------------------

  /**
   * Generate SQL statement for creating the table
   */
  public toSQL(): string {
    const sql = [`create table`];

    if (this.options.createIfNotExists) {
      sql.push("if not exists");
    }

    // Set the table names
    sql.push(this.tableName);

    // Contains table columns definition
    const columns: string[] = [];

    for (const column of this.columns) {
      // Set the column name and its type (for a specific database dialect)
      let sizeStr = "";
      if (
        COLUMN_TYPES[column.type][this.adapter.type] == "varchar"
      ) {
        sizeStr = typeof column.size === "undefined"
          ? "(255)"
          : `(${column.size})`;
      }

      const columnSQL = [
        `${column.name} ${
          COLUMN_TYPES[column.type][this.adapter.type]
        }${sizeStr}`,
      ];

      if (column.primaryKey) {
        columnSQL.push("primary key");
      }

      if (column.notNull) {
        columnSQL.push("not null");
      }

      const isIncrement = column.type === "increments" ||
        column.type === "smallIncrements" || column.type === "bigIncrements";

      // In sqlite and mysql, we need to explicitly call AUTO_INCREMENT or AUTOINCREMENT
      // to enable the auto increment feature. Unlike postgres which only uses SERIAL type.
      if (
        isIncrement &&
        (this.adapter.type === "mysql" || this.adapter.type === "sqlite")
      ) {
        // Get database specific column type for auto increment
        columnSQL.push(
          this.adapter.type === "mysql" ? "auto_increment" : "autoincrement",
        );
      }

      columns.push(columnSQL.join(" "));
    }

    // Add column definitions to the statement
    sql.push(`(${[...columns].join(", ")})`);

    return sql.join(" ") + ";";
  }

  /** Execute the SQL query */
  public async execute(): Promise<void> {
    console.log(this.toSQL());
    await this.adapter.query(this.toSQL());
  }
}
