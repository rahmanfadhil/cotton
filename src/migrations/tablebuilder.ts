import { Column } from "./column.ts";
import { Adapter } from "../adapters/adapter.ts";

export interface CreateTableOptions {
  createIfNotExists?: boolean;
}

/**
 * The table builder
 */
export class TableBuilder {
  private options: Required<CreateTableOptions>;
  private columns: Column[] = [];

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
  public id(): Column {
    return this.bigIncrements("id").primary();
  }

  public increments(name: string): Column {
    const column = new Column(name, "increments");
    this.columns.push(column);
    return column;
  }

  /** Add a big auto incremented integer column */
  public bigIncrements(name: string): Column {
    const column = new Column(name, "bigIncrements");
    this.columns.push(column);
    return column;
  }

  /** Add a small auto incremented integer column */
  public smallIncrements(name: string): Column {
    const column = new Column(name, "smallIncrements");
    this.columns.push(column);
    return column;
  }

  // --------------------------------------------------------------------------------
  // TEXT
  // --------------------------------------------------------------------------------

  /** Add a varchar column */
  public varchar(name: string, length?: number): Column {
    const column = new Column(name, "varchar", length);
    this.columns.push(column);
    return column;
  }

  /** Add a large text column */
  public text(name: string): Column {
    const column = new Column(name, "text");
    this.columns.push(column);
    return column;
  }

  // --------------------------------------------------------------------------------
  // INTEGER
  // --------------------------------------------------------------------------------

  /** Add an integer column */
  public integer(name: string): Column {
    const column = new Column(name, "integer");
    this.columns.push(column);
    return column;
  }

  /** Add a big integer column */
  public bigInteger(name: string): Column {
    const column = new Column(name, "bigInteger");
    this.columns.push(column);
    return column;
  }

  /** Add a small integer column */
  public smallInteger(name: string): Column {
    const column = new Column(name, "smallInteger");
    this.columns.push(column);
    return column;
  }

  // --------------------------------------------------------------------------------
  // DATE & TIME
  // --------------------------------------------------------------------------------

  /** Add a datetime column */
  public datetime(name: string): Column {
    const column = new Column(name, "datetime");
    this.columns.push(column);
    return column;
  }

  /** Add a datetime column */
  public date(name: string): Column {
    const column = new Column(name, "date");
    this.columns.push(column);
    return column;
  }

  /** Record timestamps when creation and update */
  public timestamps() {
    const createdAt = new Column("created_at", "datetime");
    const updatedAt = new Column("updated_at", "datetime");
    this.columns = this.columns.concat(createdAt, updatedAt);
    return [createdAt, updatedAt];
  }

  // --------------------------------------------------------------------------------
  // OTHER COLUMN TYPES
  // --------------------------------------------------------------------------------

  /** Add a boolean column */
  public boolean(name: string): Column {
    const column = new Column(name, "boolean");
    this.columns.push(column);
    return column;
  }

  // --------------------------------------------------------------------------------
  // SQL QUERY
  // --------------------------------------------------------------------------------

  /**
   * Generate SQL statement for creating the table
   */
  public toSQL(): string {
    const sql = [`CREATE TABLE`];

    if (this.options.createIfNotExists) {
      sql.push("IF NOT EXISTS");
    }

    // Set the table names
    sql.push(this.tableName);

    // Generate all column definitions
    const columns: string[] = this.columns.map((column) =>
      column.toSQL(this.adapter.dialect)
    );

    // Add column definitions to the statement
    sql.push(`(${[...columns].join(", ")})`);

    return sql.join(" ") + ";";
  }

  /** Execute the SQL query */
  public async execute(): Promise<void> {
    await this.adapter.query(this.toSQL());
  }
}
