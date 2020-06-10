import { COLUMN_TYPES } from "./constants.ts";
import { Adapter, QueryResult, QueryOptions } from "./adapters/adapter.ts";
import { SqliteAdapter } from "./adapters/sqlite.ts";

interface ColumnDefinition {
  type: keyof typeof COLUMN_TYPES;
  name: string;
  primaryKey?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
  size?: number;
}

interface TableOptions {
  dialect: "mysql" | "postgres" | "sqlite";
  createIfNotExists?: boolean;
}

/**
 * Handles a Table, create, modify or get info about the table.
 */
export class Table {
  constructor(
    /** Table name on the database */
    private tableName: string,
    /** Adapter */
    private adapter?: Adapter,
  ) {
  }

  /**
   * Create a table
   * @param options 
   */
  create(options?: TableOptions): TableBuilder {
    return new TableBuilder(this.tableName, this.adapter, options);
  }

  /**
   * Delete this table.
   */
  async delete() {
    if (!this.adapter) {
      throw new Error("Cannot run query, adapter is not provided!");
    }
    // SELECT name FROM sqlite_master WHERE type='table' AND name='${tablename}';

    return (await (await this.adapter.query(
      `DROP TABLE ${this.tableName}`,
    )).records.length) == 1;
  }

  /**
   * Modify a table(add rows or constraints). NOT IMPLEMENTED YET.
   */
  modify() {
    throw new Error("Not implementet yet");
  }
  /** Will give tableinfos(Columnnames, Row Count or Key Infos [...]) NOT IMPLEMENTED YET. */
  info() {
    return new TableInfo(this.tableName, this.adapter);
  }

  /** Checks if this Table exists. */
  exists() {
    return new TableInfo(this.tableName, this.adapter).exists();
  }
}

/**
 * A representation of a single table in database
 */
export class TableBuilder {
  private options: Required<TableOptions>;
  private columns: ColumnDefinition[] = [];

  constructor(
    /** Table name on the database */
    private tableName: string,
    /** Adapter */
    private adapter?: Adapter,
    /** Other options */
    options?: TableOptions,
  ) {
    // Populate `this.options` with default
    this.options = Object.assign(
      {},
      { createIfNotExists: false, dialect: this.adapter?.type },
      options,
    );
  }

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
        COLUMN_TYPES[column.type][this.options.dialect] == "varchar" &&
        !column.size
      ) {
        sizeStr = "(2048)";
      }
      const columnSQL = [
        `${column.name} ${
          COLUMN_TYPES[column.type][this.options.dialect]
        }${sizeStr}`,
      ];

      if (column.primaryKey) {
        columnSQL.push("primary key");
      }

      if (column.notNull) {
        columnSQL.push("not null");
      }

      // In sqlite and mysql, we need to explicitly call AUTO_INCREMENT or AUTOINCREMENT
      // to enable the auto increment feature. Unlike postgres which only uses SERIAL type.
      if (
        column.autoIncrement &&
        (this.options.dialect === "mysql" || this.options.dialect === "sqlite")
      ) {
        // Get database specific column type for auto increment
        columnSQL.push(
          this.options.dialect === "mysql" ? "auto_increment" : "autoincrement",
        );
      }

      columns.push(columnSQL.join(" "));
    }

    // Add column definitions to the statement
    sql.push(`(${[...columns].join(", ")})`);

    return sql.join(" ") + ";";
  }

  addField(field: ColumnDefinition) {
    this.columns.push(field);
    return this;
  }

  /**
   * Execute query to create table.
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
}

export class TableInfo {
  private options: Required<TableOptions>;

  constructor(
    /** Table name on the database */
    private tableName: string,
    /** Adapter */
    private adapter?: Adapter,
    /** Other options */
    options?: TableOptions,
  ) {
    // Populate `this.options` with default
    this.options = Object.assign({}, { createIfNotExists: false }, options);
  }

  /** Checks if this Table exists. */
  async exists(): Promise<boolean> {
    if (!this.adapter) {
      throw new Error("Cannot run query, adapter is not provided!");
    }
    // SELECT name FROM sqlite_master WHERE type='table' AND name='${tablename}';

    switch (this.adapter.type) {
      case "sqlite":
        return (await (await this.adapter.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${this.tableName}'`,
        )).records.length) == 1;
      case "postgres":
        var fromDB = (await (await this.adapter.query(
          `SELECT EXISTS (
              SELECT FROM pg_tables
              WHERE    tablename  = '${this.tableName}'
              )`,
        )));
        if (!!fromDB.records && !!fromDB.records[0]) {
          let result = fromDB.records[0] as any;
          return result.exists;
        } else return false;
        break;
      case "mysql":
        return (await (await this.adapter.query(
          `SELECT * 
          FROM information_schema.tables
              WHERE table_name = '${this.tableName}'
          LIMIT 1`,
        )).records.length) == 1;
        break;
      default:
        return false;
    }
  }
}
