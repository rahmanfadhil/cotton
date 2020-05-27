import { assertEquals } from "../testdeps.ts";

import { connect } from "./connect.ts";
import { SqliteAdapter } from "./adapter/sqlite.ts";
import { PostgresAdapter } from "./adapter/postgres.ts";
// import { MysqlAdapter } from "./adapter/mysql.ts";

Deno.test("connect: sqlite", async () => {
  const db = await connect({
    type: "sqlite",
    database: Deno.env.get("SQLITE_DATABASE"),
  });
  assertEquals(db instanceof SqliteAdapter, true);
  await db.disconnect();
});

Deno.test("connect: postgres", async () => {
  const db = await connect({
    type: "postgres",
    database: Deno.env.get("POSTGRES_DATABASE"),
    hostname: Deno.env.get("POSTGRES_HOSTNAME"),
    username: Deno.env.get("POSTGRES_USERNAME"),
    password: Deno.env.get("POSTGRES_PASSWORD"),
    port: Number(Deno.env.get("POSTGRES_PORT")) || 5432,
  });
  assertEquals(db instanceof PostgresAdapter, true);
  await db.disconnect();
});

// Deno.test("connect: mysql", async () => {
//   const db = await connect({
//     type: "mysql",
//     database: env.TEST_MYSQL_DATABASE,
//     hostname: env.TEST_MYSQL_HOSTNAME,
//     username: env.TEST_MYSQL_USERNAME,
//     password: env.TEST_MYSQL_PASSWORD,
//   });
//   assertEquals(db instanceof MysqlAdapter, true);
//   await db.disconnect();
// });
