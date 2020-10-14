import { Adapter, ConnectionOptions, DatabaseResult } from "./adapter.ts";
import { SqliteDB } from "../../deps.ts";
import type { DatabaseDialect } from "../connect.ts";

/**
 * SQLite database adapter
 */
export class SqliteAdapter extends Adapter {
  public dialect: DatabaseDialect = "sqlite";

  public get lastInsertedId(): number {
    return this.client?.lastInsertRowId || 0;
  }

  /**
   * Database file location
   */
  private fileLocation: string;

  /**
   * SQLite library database instance
   */
  private client?: SqliteDB;

  constructor(options: ConnectionOptions) {
    super();

    if (options.database) {
      this.fileLocation = options.database;
    } else {
      throw new Error("SQLite adapter needs 'database' property!");
    }
  }

  // TODO: handle connection error with custom error
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new SqliteDB(this.fileLocation);
      resolve();
    });
  }

  // TODO: throw an error if the user try to disconnect before they even connected
  public disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client!.close();
      resolve();
    });
  }

  public query(query: string, values?: any[]): Promise<DatabaseResult[]> {
    return new Promise((resolve, reject) => {
      // Execute query
      // TODO: handle error with custom error
      let result: any;

      if (Array.isArray(values) && values.length >= 1) {
        result = this.client!.query(query, values);
      } else {
        result = this.client!.query(query);
      }

      // Store fetch records temporarily
      const records: DatabaseResult[] = [];

      // Columns information
      let columns: string[] = [];

      // If the `result.columns` method throws an error, it means the there is no record found
      try {
        columns = result.columns().map((column: any) => column.name);

        // Populate `records` variable with fetched data
        for (const record of result) {
          let data: any = {};

          // Assign each known fields to `data`
          (record as any[]).forEach((value, index) => {
            const fieldName = columns[index];
            data[fieldName] = value;
          });

          records.push(data);
        }

        resolve(records);
      } catch {
        resolve([]);
      }
    });
  }
}
