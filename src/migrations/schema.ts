import type { Adapter } from "../adapters/adapter.ts";
import { TableBuilder, CreateTableOptions } from "./tablebuilder.ts";
import type { ColumnBuilder } from "./columnbuilder.ts";

/**
 * Database schema migration helper
 */
export class Schema {
  constructor(
    /** The database adapter */
    private adapter: Adapter,
  ) {}

  /**
   * Create a table
   * 
   * @param name the table name
   */
  public async createTable(
    name: string,
    fn: (builder: TableBuilder) => void,
    options?: CreateTableOptions,
  ) {
    const builder = new TableBuilder(name, this.adapter, options);
    fn(builder);
    await builder.execute();
  }

  /**
   * Rename a table
   * 
   * @param name the previous table name
   * @param newName a new name for the table
   */
  public async renameTable(name: string, newName: string) {
    await this.adapter.query(`ALTER TABLE ${name} RENAME TO ${newName}`);
  }

  /**
   * Drop a single table
   * 
   * @param tableName table to be dropped
   * @param options advanced options
   */
  public dropTable(
    tableName: string,
    options?: { ifExists?: boolean },
  ): Promise<void>;

  /**
   * Drop multiple tables
   * 
   * @param tableNames tables to be dropped
   * @param options advanced options
   */
  public dropTable(
    tableNames: string[],
    options?: { ifExists?: boolean },
  ): Promise<void>;

  /** Drop table from the database */
  public async dropTable(
    tableName: string | string[],
    options?: { ifExists?: boolean },
  ): Promise<void> {
    // Populate options with default values
    options = Object.assign({}, { ifExists: false }, options);

    // Build query string
    const query = [`DROP TABLE`];
    if (options.ifExists) query.push(`IF EXISTS`);

    if (Array.isArray(tableName)) {
      // SQLite doesn't support dropping multiple tables at once.
      // So, we need to execute multiple queries for it.
      if (this.adapter.dialect === "sqlite") {
        for (const table of tableName) {
          const tableQuery = query.join(" ") + ` ${table}`;
          await this.adapter.query(tableQuery);
        }
      } else {
        // Add the table name
        query.push(tableName.join(", "));

        // Perform query
        await this.adapter.query(query.join(" "));
      }
    } else {
      // Add the table name
      query.push(tableName);

      // Perform query
      await this.adapter.query(query.join(" "));
    }
  }

  /**
   * Check if a table exists in the database
   * 
   * @param tableName the table name you want to check
   */
  public async hasTable(tableName: string): Promise<boolean> {
    let query: string;

    // Decide the query
    switch (this.adapter.dialect) {
      case "sqlite":
        query =
          `SELECT EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}')`;
        break;
      case "postgres":
        query =
          `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '${tableName}')`;
        break;
      case "mysql":
        query =
          `SELECT EXISTS (SELECT * FROM information_schema.tables WHERE table_name = '${tableName}' LIMIT 1)`;
        break;
      default:
        return false;
    }

    // Execute query
    const result = await this.adapter.query(query);

    // Get the result
    switch (this.adapter.dialect) {
      case "postgres":
        return result[0] && result[0].exists ? true : false;
      case "mysql":
      case "sqlite":
      default:
        return !!result[0][Object.keys(result[0])[0]];
    }
  }

  /**
   * Check if a column exists in a table
   * 
   * @param tableName the table name you want to check
   * @param columnName the column name you're looking for
   */
  public async hasColumn(
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    let query: string;

    // Decide the query
    switch (this.adapter.dialect) {
      case "sqlite":
        query = `PRAGMA table_info(${tableName});`;
        break;
      case "mysql":
      case "postgres":
      default:
        query =
          `SELECT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='${tableName}' and column_name='${columnName}');`;
        break;
    }

    // Execute the query
    const result = await this.adapter.query(query);

    // Extract the result
    switch (this.adapter.dialect) {
      case "sqlite":
        return !!result.find((item) => item.name === columnName);
      case "postgres":
        return result[0] && result[0].exists ? true : false;
      case "mysql":
        return !!result[0][Object.keys(result[0])[0]];
      default:
        throw new Error("Database dialect not implemented!");
    }
  }

  // --------------------------------------------------------------------------------
  // ALTER TABLE
  // --------------------------------------------------------------------------------

  /** Create an index */
  public addIndex(index: string) {
    throw new Error("Not implemented yet!");
  }

  /** Remove an index */
  public removeIndex(index: string) {
    throw new Error("Not implemented yet!");
  }

  /**
   * Rename a column
   * 
   * @param tableName the table name where the column exists
   * @param columnName the column you want to rename
   * @param newColumnName the new column name
   */
  public async renameColumn(
    tableName: string,
    columnName: string,
    newColumnName: string,
  ) {
    await this.adapter.query(
      `ALTER TABLE ${tableName} RENAME ${columnName} TO ${newColumnName}`,
    );
  }

  /**
   * Create a new column
   * 
   * @param tableName the table name where the column should be added
   * @param column the column builder
   */
  public async addColumn(tableName: string, column: ColumnBuilder) {
    await this.adapter.query(
      `ALTER TABLE ${tableName} ADD ${column.toSQL(this.adapter.dialect)}`,
    );
  }

  /** Update a column's datatype */
  public alterColumn(column: string, newColumn: string) {
    throw new Error("Not implemented yet!");
  }

  /**
   * Remove a column
   * 
   * @param tableName the table name where the column exists
   * @param columnName the name of the column you want to remove
   */
  public async dropColumn(tableName: string, columnName: string) {
    switch (this.adapter.dialect) {
      case "sqlite":
        throw new Error("SQLite doesn't support DROP COLUMN at the moment!");
      case "mysql":
      case "postgres":
      default:
        await this.adapter.query(
          `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`,
        );
        break;
    }
  }

  /** Execute SQL query */
  public query(query: string) {
    return this.adapter.query(query);
  }
}
