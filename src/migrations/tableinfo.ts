import { Adapter } from "../adapters/adapter.ts";

/**
 * Get the information of a table
 */
export class TableInfo {
  constructor(
    /** Table name on the database */
    private tableName: string,
    /** The database adapter */
    private adapter: Adapter,
  ) {
  }

  /** Check if this table exists in the database */
  public async exists(): Promise<boolean> {
    if (!this.adapter) {
      throw new Error("Cannot run query, adapter is not provided!");
    }

    switch (this.adapter.type) {
      case "sqlite":
        const sqliteQuery = await this.adapter.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${this.tableName}'`,
        );
        return sqliteQuery.length === 1;
      case "postgres":
        const postgresQuery = await this.adapter.query(
          `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '${this.tableName}')`,
        );
        if (postgresQuery[0]) {
          let result = postgresQuery[0] as any;
          return result.exists;
        } else {
          return false;
        }
      case "mysql":
        const mysqlQuery = await this.adapter.query(
          `SELECT * FROM information_schema.tables WHERE table_name = '${this.tableName}' LIMIT 1`,
        );
        return mysqlQuery.length === 1;
      default:
        return false;
    }
  }
}
