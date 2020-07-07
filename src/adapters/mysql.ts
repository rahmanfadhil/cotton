import { MysqlClient, MysqlClientConfig } from "../../deps.ts";
import { Adapter, ConnectionOptions } from "./adapter.ts";
import { DatabaseDialect } from "../connect.ts";

/**
 * MySQL database adapter
 */
export class MysqlAdapter extends Adapter {
  private _lastInsertedId: number = 0;

  public getLastInsertedId(): Promise<number> {
    return Promise.resolve(this._lastInsertedId);
  }

  public dialect: DatabaseDialect = "mysql";

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
  async query<T>(query: string, values?: any[]): Promise<T[]> {
    let records: any;

    if (Array.isArray(values) && values.length >= 1) {
      records = await this.client.query(query, values);
    } else {
      records = await this.client.query(query);
    }

    if (records.lastInsertId && records.affectedRows) {
      this._lastInsertedId = records.lastInsertId + records.affectedRows - 1;
    }

    return Array.isArray(records) ? records : [];
  }
}
