import { SqliteAdapter } from "./sqlite.ts";
import { sqliteOptions } from "../testutils.ts";

Deno.test("SqliteAdapter: should connect to database and disconnect to database", async () => {
  const adapter = new SqliteAdapter(sqliteOptions);
  await adapter.connect();
  await adapter.disconnect();
});
