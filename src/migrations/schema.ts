import { Adapter } from "../adapters/adapter.ts";
import { TableBuilder, CreateTableOptions } from "./tablebuilder.ts";
import { TableUpdater } from "./tableupdater.ts";
import { TableInfo } from "./tableinfo.ts";

/**
 * Database schema migration helper
 */
export class Schema {
  constructor(
    /** The database adapter */
    private adapter: Adapter,
  ) {}

  /** Create a table */
  public async createTable(
    tableName: string,
    fn: (builder: TableBuilder) => void,
    options?: CreateTableOptions,
  ) {
    const builder = new TableBuilder(tableName, this.adapter, options);
    fn(builder);
    await builder.execute();
  }

  /** Alter table columns */
  public alterTable(tableName: string): TableUpdater {
    throw new Error("Not implemented yet!");
  }

  /** Rename a table */
  public async renameTable(tableName: string, newTableName: string) {
    await this.adapter.execute(
      `ALTER TABLE ${tableName} RENAME TO ${newTableName}`,
    );
  }

  /** Drop a table */
  public async dropTable(
    tableName: string,
    options?: { ifExists?: boolean },
  ) {
    // Populate options with default values
    options = Object.assign({}, options, { ifExists: false });

    // Build query string
    const query = [`DROP TABLE`];
    query.push(tableName);
    if (options.ifExists) query.push(`IF EXISTS`);

    // Perform query
    await this.adapter.query(query.join(" "));
  }

  /** Drop multiple tables */
  public async dropTables(
    tableNames: string[],
    options?: { ifExists?: boolean },
  ) {
    for (const table of tableNames) {
      await this.dropTable(table, options);
    }
  }

  /** Get table info */
  public getTableInfo(tableName: string): TableInfo {
    return new TableInfo(tableName, this.adapter);
  }
}
