import { Adapter, ConnectionOptions } from "./adapters/adapter.ts";
import { connect } from "./connect.ts";
import { dotenv, fileExistsSync } from "../testdeps.ts";

// Load .env file if exists
if (fileExistsSync("./.env")) {
  dotenv({ export: true });
}

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
    name,
    fn: async () => {
      // Connect to database
      const db = await connect({
        type: "sqlite",
        ...sqliteOptions,
      });

      // Run the actual test
      await fn(db);

      // Disconnect to database
      await db.disconnect();
    },
  });
}
