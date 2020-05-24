import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

import { connect } from "./connect.ts";
import { SqliteAdapter } from "./adapter/sqlite.ts";
import { PostgresAdapter } from "./adapter/postgres.ts";
import { MysqlAdapter } from "./adapter/mysql.ts";

const env = config({ path: ".env.test" });

Deno.test("connect() sqlite", async () => {
  const db = await connect({
    type: "sqlite",
    database: env.TEST_SQLITE_DATABASE,
  });
  assertEquals(db instanceof SqliteAdapter, true);
  await db.disconnect();
});

Deno.test("connect() postgres", async () => {
  const db = await connect({
    type: "postgres",
    database: env.TEST_POSTGRES_DATABASE,
    hostname: env.TEST_POSTGRES_HOSTNAME,
    username: env.TEST_POSTGRES_USERNAME,
    password: env.TEST_POSTGRES_PASSWORD,
  });
  assertEquals(db instanceof PostgresAdapter, true);
  await db.disconnect();
});

Deno.test("connect() mysql", async () => {
  const db = await connect({
    type: "mysql",
    database: env.TEST_MYSQL_DATABASE,
    hostname: env.TEST_MYSQL_HOSTNAME,
    username: env.TEST_MYSQL_USERNAME,
    password: env.TEST_MYSQL_PASSWORD,
  });
  assertEquals(db instanceof MysqlAdapter, true);
  await db.disconnect();
});
