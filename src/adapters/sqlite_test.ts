import { SqliteAdapter } from "./sqlite.ts";
import { sqliteOptions } from "../testutils.ts";
import { assertEquals } from "../../testdeps.ts";
import { DateUtils } from "../utils/date.ts";

Deno.test("SqliteAdapter: should connect to database and disconnect to database", async () => {
  const adapter = new SqliteAdapter(sqliteOptions);
  await adapter.connect();
  await adapter.disconnect();
});

Deno.test("SqliteAdapter: getLastInsertedId", async () => {
  const client = new SqliteAdapter(sqliteOptions);
  await client.connect();

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255),
      age INTEGER,
      created_at DATETIME
    );
  `);

  assertEquals(await client.getLastInsertedId(), 0);

  client.query(
    `insert into users (email, age, created_at) values ('a@b.com', 16, '${
      DateUtils.formatDate(new Date())
    }')`,
  );

  assertEquals(await client.getLastInsertedId(), 1);

  await client.execute("DROP TABLE users");

  await client.disconnect();
});
