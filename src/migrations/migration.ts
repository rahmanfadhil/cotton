import { Adapter } from "../adapters/adapter.ts";
import { TableBuilder, CreateTableOptions } from "./tablebuilder.ts";
import { TableUpdater } from "./tableupdater.ts";
import { TableInfo } from "./tableinfo.ts";

/**
 * Database schema migration helper
 */
export class Migration {
  constructor(
    /** The database adapter */
    private adapter: Adapter,
  ) {}

  /** Create a table */
  public async createTable(
    tableName: string,
    fn: (table: TableBuilder) => void,
    options?: CreateTableOptions,
  ) {
    const tableBuilder = new TableBuilder(tableName, this.adapter, options);
    fn(tableBuilder);
    const query = tableBuilder.toSQL();
    await this.adapter.execute(query);
  }

  /** Alter table columns */
  public alterTable(tableName: string, fn: (table: TableUpdater) => void) {
    throw new Error("Not implemented yet!");
  }

  /** Alter table columns */
  public renameTable(tableName: string, newTableName: string) {
    throw new Error("Not implemented yet!");
  }

  /** Drop a table */
  public async dropTable(
    tableName: string,
    options?: { ifExists: boolean },
  ) {
    // Populate options with default values
    options = Object.assign({}, options, { ifExists: false });

    // Build query string
    const query = [`DROP TABLE`];
    if (options.ifExists) query.push(`IF EXISTS`);
    query.push(tableName);

    // Perform query
    const result = await this.adapter.query(query.join(" "));
    return result.records.length === 1;
  }

  /** Drop multiple tables */
  public dropTables(tableNames: string[]) {
    throw new Error("Not implemented yet!");
  }

  /** Get table info */
  public getTableInfo(tableName: string): TableInfo {
    return new TableInfo(tableName, this.adapter);
  }
}
