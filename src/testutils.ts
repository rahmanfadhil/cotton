import { Adapter, ConnectionOptions } from "./adapters/adapter.ts";
import { connect } from "./connect.ts";

/**
 * Postgres connection options
 */
export const postgresOptions: ConnectionOptions = {
  database: Deno.env.get("POSTGRES_DATABASE"),
  hostname: Deno.env.get("POSTGRES_HOSTNAME"),
  username: Deno.env.get("POSTGRES_USERNAME"),
  password: Deno.env.get("POSTGRES_PASSWORD"),
  port: Number(Deno.env.get("POSTGRES_PORT")) || 5432,
};

/**
 * MySQL connection options
 */
export const mysqlOptions: ConnectionOptions = {
  database: Deno.env.get("MYSQL_DATABASE"),
  hostname: Deno.env.get("MYSQL_HOSTNAME"),
  username: Deno.env.get("MYSQL_USERNAME"),
  password: Deno.env.get("MYSQL_PASSWORD"),
  port: Number(Deno.env.get("MYSQL_PORT")) || 3306,
};

/**
 * SQLite connection options
 */
export const sqliteOptions: ConnectionOptions = {
  database: ":memory:",
};

/**
 * Create test with database client
 * 
 * @param name Test name
 * @param fn Test function
 * 
 * TODO: automatically create tests for all database (mysql, postgres, and sqlite)
 */
export async function testDB(
  name: string,
  fn: (client: Adapter) => void | Promise<void>,
) {
  Deno.test({
    name: `[sqlite] ${name}`,
    fn: async () => {
      // Connect to database
      const db = await connect({
        type: "sqlite",
        ...sqliteOptions,
      });

      // Create dummy table `users`
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255),
          age INTEGER,
          created_at DATETIME
        );
      `);

      // Run the actual test
      await fn(db);

      // Drop dummy table `users`
      await db.execute("DROP TABLE users;");

      // Disconnect to database
      await db.disconnect();
    },
  });

  Deno.test({
    name: `[postgres] ${name}`,
    fn: async () => {
      // Connect to database
      const db = await connect({
        type: "postgres",
        ...postgresOptions,
      });

      // Create dummy table `users`
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255),
          age INTEGER,
          created_at TIMESTAMP
        );
      `);

      // Run the actual test
      await fn(db);

      // Drop dummy table `users`
      await db.execute("DROP TABLE users;");

      // Disconnect to database
      await db.disconnect();
    },
  });

  Deno.test({
    name: `[mysql] ${name}`,
    fn: async () => {
      // Connect to database
      const db = await connect({
        type: "mysql",
        ...mysqlOptions,
      });

      // Create dummy table `users`
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          email VARCHAR(255),
          age INTEGER,
          created_at DATETIME
        );
      `);

      // Run the actual test
      await fn(db);

      // Drop dummy table `users`
      await db.execute("DROP TABLE users;");

      // Disconnect to database
      await db.disconnect();
    },
  });
}
