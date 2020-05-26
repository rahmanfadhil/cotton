import { PostgresClient } from "../../deps.ts";
import { BaseAdapter, ConnectionOptions } from "../baseadapter.ts";

export class PostgresAdapter extends BaseAdapter {
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

    // Map query result
    return result.rows.map((rowValues): T => {
      const data: any = {};

      // Assign each known fields to `data`
      result.rowDescription.columns.forEach((item, index) => {
        data[item.name] = rowValues[index];
      });

      return data;
    });
  }

  // TODO: handle error with custom error
  public async execute(query: string, values: any[] = []): Promise<void> {
    await this.client.query(query, ...values);
  }
}
