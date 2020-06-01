import { PostgresClient } from "../../deps.ts";
import { Adapter, ConnectionOptions } from "./adapter.ts";

/**
 * PostgreSQL database adapter
 */
export class PostgresAdapter extends Adapter {
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

  public async query<T>(query: string, values: any[] = []): Promise<T[]> {
    // Run query
    // TODO: handle error with custom error
    const result = await this.client.query(query, ...values);

    // Get query results as JavaScript objects
    return result.rowsOfObjects() as T[];
  }

  // TODO: handle error with custom error
  public async execute(query: string, values: any[] = []): Promise<void> {
    await this.client.query(query, ...values);
  }
}
