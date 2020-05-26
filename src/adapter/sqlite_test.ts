import { SqliteAdapter } from "./sqlite.ts";

Deno.test("SqliteAdapter: should connect to database and disconnect to database", async () => {
  const adapter = new SqliteAdapter({
    database: Deno.env.get("TEST_SQLITE_DATABASE"),
  });
  await adapter.connect();
  await adapter.disconnect();
});
