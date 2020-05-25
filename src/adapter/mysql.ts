import { MysqlClient, MysqlClientConfig } from "../../deps.ts";
import { BaseAdapter, ConnectionOptions } from "../baseadapter.ts";

export class MysqlAdapter extends BaseAdapter {
  /**
   * MySQL library database client
   */
  private client: MysqlClient;

  /**
   * MySQL client configurations
   */
  private options: MysqlClientConfig;

  constructor(options: ConnectionOptions) {
    super();

    this.client = new MysqlClient();
    this.options = {
      db: options.database,
      username: options.username,
      hostname: options.hostname,
      port: options.port,
      password: options.password,
    };
  }

  // FIXME: doesn't throw an error if the connection failed
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
