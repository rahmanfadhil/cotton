import { PostgresClient } from "../../deps.ts";
import {
  Adapter,
  ConnectionOptions,
  GetLastInsertedIdOptions,
} from "./adapter.ts";
import { DatabaseDialect } from "../connect.ts";

/**
 * PostgreSQL database adapter
 */
export class PostgresAdapter extends Adapter {
  public dialect: DatabaseDialect = "postgres";

  /**
   * Postgres client
   */
  private client: PostgresClient;

  public async getLastInsertedId(
    options?: GetLastInsertedIdOptions,
  ): Promise<number> {
    if (!options || !options.tableName || !options.primaryKey) {
      throw new Error(
        "Cannot get last inserted row id without 'tableName' and 'primaryKey' in 'postgres'",
      );
    }

    try {
      const result = await this.client.query(
        `SELECT currval(pg_get_serial_sequence('${options.tableName}', '${options.primaryKey}'));`,
      );
      return parseInt(result.rows[0][0]);
    } catch {
      return 0;
    }
  }

  constructor(options: ConnectionOptions) {
    super();

    this.client = new PostgresClient({
      database: options.database,
      port: options.port,
      hostname: options.hostname,
      password: options.password,
      user: options.username,
      applicationName: options.applicationName,
    });
  }

  // TODO: handle connection error with custom error
  public connect(): Promise<void> {
    return this.client.connect();
  }

  // TODO: throw custom error if the user try to disconnect before they even connected
  public disconnect(): Promise<void> {
    return this.client.end();
  }

  public async query<T>(query: string, values?: any[]): Promise<T[]> {
    let result = Array.isArray(values) && values.length >= 1
      ? await this.client.query({ text: query, args: values })
      : await this.client.query(query);

    return result.rowsOfObjects() as T[];
  }
}
