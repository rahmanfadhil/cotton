import { SqliteAdapter } from "./sqlite.ts";

Deno.test("should connect to database and disconnect to database", async () => {
  const adapter = new SqliteAdapter({ database: "./test.db" });
  await adapter.connect();
  await adapter.disconnect();
});
