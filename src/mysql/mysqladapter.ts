import { Client, ClientConfig } from "https://deno.land/x/mysql/mod.ts";
import { DatabaseAdapter } from "../adapter.ts";

interface MysqlConnectionOptions extends ClientConfig {}

export class MysqlAdapter implements DatabaseAdapter {
  /**
   * MySQL library database client
   */
  private client: Client;

  /**
   * Connection configurations
   */
  private options: MysqlConnectionOptions;

  constructor(options: MysqlConnectionOptions) {
    this.client = new Client();
    this.options = options;
  }

  async connect(): Promise<void> {
    await this.client.connect(this.options);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async query<T>(query: string, values: any[] = []): Promise<T[]> {
    return this.client.query(query, values);
  }

  async execute(query: string, values: any[] = []): Promise<void> {
    await this.client.execute(query, values);
  }
}
