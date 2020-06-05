import { PostgresClient } from "../../deps.ts";
import {
  Adapter,
  ConnectionOptions,
  QueryResult,
  QueryOptions,
} from "./adapter.ts";
import { SupportedDatabaseType } from "../connect.ts";

/**
 * PostgreSQL database adapter
 */
export class PostgresAdapter extends Adapter {
  public type: SupportedDatabaseType = "postgres";

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

  public async query<T>(
    query: string,
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    if (options?.getLastInsertedId) {
      // PostgreSQL driver doesn't have any special way to fetch the last inserted row id.
      // So, we need to fetch it manually, and we need the table name and its primary key
      // to do that.
      if (options.info && options.info.primaryKey && options.info.primaryKey) {
        // Run query
        // TODO: handle error with custom error
        const [records, lastInsertedId] = await this.client.multiQuery([
          { text: query },
          {
            text:
              `SELECT currval(pg_get_serial_sequence('${options.info.tableName}', '${options.info.primaryKey}'));`,
          },
        ]);

        // Transform records to plain JavaScript objects
        return {
          records: records.rowsOfObjects() as T[],
          lastInsertedId: Number(lastInsertedId.rows[0][0]),
        };
      } else {
        throw new Error(
          "Cannot get last inserted id in PostgreSQL without `tableName` and `primaryKey`!",
        );
      }
    } else {
      // Run query
      // TODO: handle error with custom error
      const records = await this.client.query(query);

      // Transform records to plain JavaScript objects
      return { records: records.rowsOfObjects() as T[], lastInsertedId: 0 };
    }
  }

  // TODO: handle error with custom error
  public async execute(query: string, values: any[] = []): Promise<void> {
    await this.client.query(query, ...values);
  }
}
