export interface DatabaseAdapter {
  /**
   * Run SQL query and get the result
   * 
   * @param query SQL query to run (ex: "SELECT * FROM users;")
   * @param values Bind values to query to prevent SQL injection
   */
  query<T>(query: string, values?: any[]): Promise<T[]>;

  /**
   * Execute SQL statement and save changes to database
   * 
   * @param query SQL query to run (ex: "INSERT INTO users (email) VALUES ('a@b.com');")
   * @param values Bind values to query to prevent SQL injection
   */
  execute(query: string, values?: any[]): Promise<void>;

  /**
   * Connect to database
   */
  connect(): Promise<void>;
}
