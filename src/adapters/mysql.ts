import { MysqlClient, MysqlClientConfig } from "../../deps.ts";
import {
  Adapter,
  ConnectionOptions,
  QueryResult,
  QueryOptions,
} from "./adapter.ts";

/**
 * MySQL database adapter
 */
export class MysqlAdapter extends Adapter {
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
  // TODO: handle connection error with custom error
  async connect(): Promise<void> {
    await this.client.connect(this.options);
  }

  // TODO: handle connection error with custom error
  async disconnect(): Promise<void> {
    await this.client.close();
  }

  // TODO: handle error with custom error
  async query<T>(
    query: string,
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    const records = await this.client.query(query);
    const lastInsertedId = records.lastInsertId || 0;
    return { lastInsertedId, records };
  }

  // TODO: handle error with custom error
  async execute(query: string, values: any[] = []): Promise<void> {
    await this.client.execute(query, values);
  }
}
