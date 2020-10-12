import { QueryBuilder } from "../querybuilder.ts";
import type { DatabaseDialect } from "../connect.ts";
import { Manager } from "../manager.ts";

/**
 * Database connection options
 */
export interface ConnectionOptions {
  database?: string;
  username?: string;
  port?: number;
  hostname?: string;
  password?: string;
  applicationName?: string;
}

export type DatabaseValues =
  | string
  | number
  | Date
  | boolean
  | null
  | undefined;

export interface DatabaseResult {
  [key: string]: DatabaseValues;
}

/**
 * The parent class for all database adapters
 */
export abstract class Adapter {
  public abstract dialect: DatabaseDialect;

  public abstract lastInsertedId: number;

  /**
   * Run SQL query and get the result
   *
   * @param query SQL query to run (ex: "SELECT * FROM users;")
   * @param values provides values to query placeholders
   */
  public abstract query(
    query: string,
    values?: DatabaseValues[],
  ): Promise<DatabaseResult[]>;

  /**
   * Connect database
   */
  public abstract connect(): Promise<void>;

  /**
   * Disconnect database
   */
  public abstract disconnect(): Promise<void>;

  /**
   * Query builder
   *
   * @param tableName The table name which the query is targetting
   */
  public table(tableName: string): QueryBuilder {
    return new QueryBuilder(tableName, this);
  }

  /**
   * Get the model manager
   */
  public getManager() {
    return new Manager(this);
  }

  /**
   * Start a database transaction.
   */
  async transaction(fn: () => Promise<void>): Promise<void> {
    const query = this.dialect === "sqlite"
      ? "BEGIN TRANSACTION;"
      : "START TRANSACTION;";
    await this.query(query);

    try {
      await fn();
      await this.query("COMMIT;");
    } catch (err) {
      await this.query("ROLLBACK;");
      throw err;
    }
  }
}
