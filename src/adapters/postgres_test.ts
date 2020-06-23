import { PostgresAdapter } from "./postgres.ts";
import { postgresOptions } from "../testutils.ts";
import { assertEquals } from "../../testdeps.ts";
import { DateUtils } from "../utils/date.ts";

Deno.test("PostgresAdapter: should connect to database and disconnect to database", async () => {
  const adapter = new PostgresAdapter(postgresOptions);
  await adapter.connect();
  await adapter.disconnect();
});

Deno.test("PostgresAdapter: getLastInsertedId", async () => {
  const client = new PostgresAdapter(postgresOptions);
  await client.connect();

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255),
      age INTEGER,
      created_at TIMESTAMP
    );
  `);

  assertEquals(
    await client.getLastInsertedId({ tableName: "users", primaryKey: "id" }),
    0,
  );

  await client.query(
    `insert into users (email, age, created_at) values ('a@b.com', 16, '${
      DateUtils.formatDate(new Date())
    }')`,
  );

  assertEquals(
    await client.getLastInsertedId({ tableName: "users", primaryKey: "id" }),
    1,
  );

  await client.execute("DROP TABLE users");

  await client.disconnect();
});
