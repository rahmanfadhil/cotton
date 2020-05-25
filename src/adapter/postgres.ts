import { Client } from "https://deno.land/x/postgres/mod.ts";
import { BaseAdapter, ConnectionOptions } from "../baseadapter.ts";

export class PostgresAdapter extends BaseAdapter {
  /**
   * Postgres client
   */
  private client: Client;

  constructor(options: ConnectionOptions) {
    super();

    this.client = new Client({
      database: options.database,
      port: options.port || 5432,
      hostname: options.hostname,
      password: options.password,
      user: options.username,
    });
  }

  public connect(): Promise<void> {
    return this.client.connect();
  }

  public disconnect(): Promise<void> {
    return this.client.end();
  }

  public async query<T>(query: string, values: any[] = []): Promise<T[]> {
    // Run query
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

  public async execute(query: string, values: any[] = []): Promise<void> {
    await this.client.query(query, ...values);
  }
}
