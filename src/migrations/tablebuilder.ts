import { ColumnBuilder } from "./columnbuilder.ts";
import type { Adapter } from "../adapters/adapter.ts";
import { quote } from "../utils/dialect.ts";
import { ForeignActions, Foreign } from "./foreign.ts";

export interface CreateTableOptions {
  createIfNotExists?: boolean;
}

/**
 * The table builder
 */
export class TableBuilder {
  private options: Required<CreateTableOptions>;
  private columns: (ColumnBuilder | string)[] = [];
  private extras: string[] = [];

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

  /**
   * Add an auto incremented primary key called `id`
   */
  public id(): ColumnBuilder {
    return this.bigIncrements("id").primary();
  }

  /**
   * Add an auto incremented integer column
   * 
   * @param name the column name
   */
  public increments(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "increments");
    this.columns.push(column);
    return column;
  }

  /**
   * Add a big auto incremented integer column
   * 
   * @param name the column name
   */
  public bigIncrements(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "bigIncrements");
    this.columns.push(column);
    return column;
  }

  /**
   * Add a small auto incremented integer column
   * 
   * @param name the column name
   */
  public smallIncrements(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "smallIncrements");
    this.columns.push(column);
    return column;
  }

  // --------------------------------------------------------------------------------
  // TEXT
  // --------------------------------------------------------------------------------

  /**
   * Add a varchar column
   * 
   * @param name the column name
   */
  public varchar(name: string, length?: number): ColumnBuilder {
    const column = new ColumnBuilder(name, "varchar", length);
    this.columns.push(column);
    return column;
  }

  /**
   * Add a large text column
   * 
   * @param name the column name
   */
  public text(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "text");
    this.columns.push(column);
    return column;
  }

  // --------------------------------------------------------------------------------
  // INTEGER
  // --------------------------------------------------------------------------------

  /**
   * Add an integer column
   * 
   * @param name the column name
   */
  public integer(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "integer");
    this.columns.push(column);
    return column;
  }

  /**
   * Add a big integer column
   * 
   * @param name the column name
   */
  public bigInteger(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "bigInteger");
    this.columns.push(column);
    return column;
  }

  /**
   * Add a small integer column
   * 
   * @param name the column name
   */
  public smallInteger(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "smallInteger");
    this.columns.push(column);
    return column;
  }

  // --------------------------------------------------------------------------------
  // DATE & TIME
  // --------------------------------------------------------------------------------

  /**
   * Add a datetime column
   * 
   * @param name the column name
   */
  public datetime(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "datetime");
    this.columns.push(column);
    return column;
  }

  /**
   * Add a datetime column
   * 
   * @param name the column name
   */
  public date(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "date");
    this.columns.push(column);
    return column;
  }

  /**
   * Record timestamps when creation and update
   * 
   * @param name the column name
   */
  public timestamps() {
    const createdAt = new ColumnBuilder("created_at", "datetime");
    const updatedAt = new ColumnBuilder("updated_at", "datetime");
    this.columns = this.columns.concat(createdAt, updatedAt);
    return [createdAt, updatedAt];
  }

  // --------------------------------------------------------------------------------
  // OTHER COLUMN TYPES
  // --------------------------------------------------------------------------------

  /**
   * Add a boolean column
   * 
   * @param name the column name
   */
  public boolean(name: string): ColumnBuilder {
    const column = new ColumnBuilder(name, "boolean");
    this.columns.push(column);
    return column;
  }

  /**
   * Add a custom SQL column
   * 
   * @param sql custom column query
   */
  public custom(sql: string) {
    this.columns.push(sql);
  }

  /**
   * Add a foreign key
   *
   * @param name the column name
   */
  public foreignId(name: string, tableName: string, options?: {
    constraint?: string;
    onDelete?: ForeignActions;
    onUpdate?: ForeignActions;
  }) {
    let column: ColumnBuilder;

    // SQLite doesn't support big integer for primary key
    if (this.adapter.dialect === "sqlite") {
      column = this.integer(name);
    } else {
      column = this.bigInteger(name);
    }

    // Add the foreign key definition at the bottom of the query
    this.extras.push(new Foreign({
      ...options,
      referencedTableName: tableName,
      referencedColumns: ["id"],
      columns: [name],
    }).toSQL(this.adapter.dialect));

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

    // Set the table name
    sql.push(quote(this.tableName, this.adapter.dialect));

    // Generate all column definitions
    const columns: string[] = this.columns.map((column): string => {
      return column instanceof ColumnBuilder
        ? column.toSQL(this.adapter.dialect)
        : column;
    });

    // Add all extra queries (foreign keys, etc.) after the column definitions
    for (const extraQuery of this.extras) {
      columns.push(extraQuery);
    }

    // Add column definitions to the statement
    sql.push(`(${[...columns].join(", ")})`);

    return sql.join(" ") + ";";
  }

  /**
   * Execute the SQL query
   */
  public async execute(): Promise<void> {
    await this.adapter.query(this.toSQL());
  }
}
