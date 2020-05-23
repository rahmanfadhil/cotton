import { BaseAdapter } from "../baseadapter.ts";
import { open, save, DB } from "https://deno.land/x/sqlite/mod.ts";

interface SqliteConnectionOptions {
  database: string;
}

export class SqliteAdapter implements BaseAdapter {
  /**
   * Database file location
   */
  private fileLocation: string;

  /**
   * SQLite library database instance
   */
  private client?: DB;

  constructor(options: SqliteConnectionOptions) {
    this.fileLocation = options.database;
  }

  public async connect(): Promise<void> {
    this.client = await open(this.fileLocation);
  }

  public async disconnect(): Promise<void> {
    this.client!.close();
  }

  public async query<T>(query: string, values: any[] = []): Promise<T[]> {
    // Execute query
    const result = this.client!.query(query, values);

    // Get columns information
    const columns = result.columns();

    // Store fetch records temporarily
    const records: T[] = [];

    // Populate `records` variable with fetched data
    for (const record of result) {
      let data: any = {};

      // Assign each known fields to `data`
      (record as any[]).forEach((value, index) => {
        const fieldName = columns[index].name;
        data[fieldName] = value;
      });

      records.push(data);
    }

    return records;
  }

  public async execute(query: string, values: any[] = []) {
    // Execute SQL statement
    this.client!.query(query, values);

    // Save changes to database file
    await save(this.client!);
  }
}
