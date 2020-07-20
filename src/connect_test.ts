import { assertEquals, assertThrowsAsync, assert } from "../testdeps.ts";
import { joinPath } from "../testdeps.ts";

import { connect } from "./connect.ts";
import { SqliteAdapter } from "./adapters/sqlite.ts";
import { PostgresAdapter } from "./adapters/postgres.ts";
import { MysqlAdapter } from "./adapters/mysql.ts";
import { mysqlOptions, postgresOptions, sqliteOptions } from "./testutils.ts";
import { ManagedModel } from "./managedmodel.ts";
import { Manager } from "./manager.ts";

Deno.test("connect() -> sqlite", async () => {
  const db = await connect({ type: "sqlite", ...sqliteOptions });
  assertEquals(db instanceof SqliteAdapter, true);
  await db.disconnect();
});

Deno.test("connect() -> postgres", async () => {
  const db = await connect({ type: "postgres", ...postgresOptions });
  assertEquals(db instanceof PostgresAdapter, true);
  await db.disconnect();
});

Deno.test("connect() -> mysql", async () => {
  const db = await connect({ type: "mysql", ...mysqlOptions });
  assertEquals(db instanceof MysqlAdapter, true);
  await db.disconnect();
});

Deno.test("connect() -> should activate models", async () => {
  class User extends ManagedModel {}
  class Post extends ManagedModel {}

  assertEquals((User as any).manager, undefined);
  assertEquals((Post as any).manager, undefined);

  const db = await connect({
    type: "sqlite",
    ...sqliteOptions,
    models: [User, Post],
  });

  assert((User as any).manager instanceof Manager);
  assert((Post as any).manager instanceof Manager);

  await db.disconnect();
});

Deno.test("connect() -> ormconfig.json", async () => {
  await Deno.writeTextFile(
    joinPath(Deno.cwd(), "./ormconfig.json"),
    JSON.stringify({ type: "sqlite", database: ":memory:" }),
  );

  const db = await connect();
  assertEquals(db instanceof SqliteAdapter, true);
  await db.disconnect();

  await Deno.remove(joinPath(Deno.cwd(), "./ormconfig.json"));
});

Deno.test("connect() -> ormconfig.json not found", async () => {
  await assertThrowsAsync(
    async () => await connect(),
    Error,
    "Cannot connect to database without connection options!",
  );
});
