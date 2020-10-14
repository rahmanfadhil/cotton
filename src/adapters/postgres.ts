import { PostgresClient } from "../../deps.ts";
import { Adapter, ConnectionOptions, DatabaseResult } from "./adapter.ts";
import type { DatabaseDialect } from "../connect.ts";

/**
 * PostgreSQL database adapter
 */
export class PostgresAdapter extends Adapter {
  public dialect: DatabaseDialect = "postgres";

  // This value will never change, so use RETURNING statement to get the last inserted id
  public lastInsertedId = 0;

  /**
   * Postgres client
   */
  private client: PostgresClient;

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

  public async query(query: string, values?: any[]): Promise<DatabaseResult[]> {
    let result = Array.isArray(values) && values.length >= 1
      ? await this.client.query({ text: query, args: values })
      : await this.client.query(query);

    return result.rowsOfObjects();
  }
}
