import { BaseAdapter, ConnectionOptions } from "../baseadapter.ts";
import { sqliteOpen, sqliteSave, SqliteDB } from "../../deps.ts";

/**
 * SQLite database adapter
 */
export class SqliteAdapter extends BaseAdapter {
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
  public async connect(): Promise<void> {
    this.client = await sqliteOpen(this.fileLocation);
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
  public async execute(query: string, values: any[] = []) {
    // Execute SQL statement
    this.client!.query(query, values);

    // Save changes to database file
    await sqliteSave(this.client!);
  }
}
