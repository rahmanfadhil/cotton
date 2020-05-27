import { BaseAdapter } from "./baseadapter.ts";
import { connect } from "./connect.ts";
import { fileExistsSync } from "../testdeps.ts";

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
  fn: (client: BaseAdapter) => void | Promise<void>,
) {
  Deno.test({
    name,
    fn: async () => {
      // Database file location
      const dbFile = Deno.env.get("SQLITE_DATABASE") || "./db.sqlite3";

      // Connect to database
      const db = await connect({
        type: "sqlite",
        database: dbFile,
      });

      // Run the actual test
      await fn(db);

      // Disconnect to database
      await db.disconnect();

      // Flush database
      if (fileExistsSync(dbFile)) {
        await Deno.remove(dbFile);
      }
    },
  });
}
