import { Adapter, ConnectionOptions } from "./adapter.ts";
import { SqliteDB } from "../../deps.ts";

/**
 * SQLite database adapter
 */
export class SqliteAdapter extends Adapter {
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

  public query<T>(query: string, values: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      // Execute query
      // TODO: handle error with custom error
      const result = this.client!.query(query, values);

      console.log(result);

      // Store fetch records temporarily
      const records: T[] = [];

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

  // TODO: handle error with custom error
  public execute(query: string, values: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      // Execute SQL statement
      this.client!.query(query, values);
      resolve();
    });
  }
}
