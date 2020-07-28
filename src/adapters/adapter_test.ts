import { testDB, assertDateEquals } from "../testutils.ts";
import {
  assertThrowsAsync,
  assertEquals,
  assert,
  spy,
} from "../../testdeps.ts";
import { QueryBuilder } from "../querybuilder.ts";
import { formatDate } from "../utils/date.ts";
import { Manager } from "../manager.ts";
import { Adapter } from "./adapter.ts";

Deno.test("Adapter.transaction() -> should commit transaction", async () => {
  for (const dialect of ["sqlite", "postgres", "mysql"]) {
    const query = spy();
    const adapter: Adapter = Object.assign(
      Object.create(Adapter.prototype),
      { query, dialect },
    );

    await adapter.transaction(async () => {
      await adapter.query("SELECT * FROM users;");
    });

    assertEquals(query.calls, [{
      self: adapter,
      args: [
        dialect === "sqlite" ? "BEGIN TRANSACTION;" : "START TRANSACTION;",
      ],
    }, {
      self: adapter,
      args: ["SELECT * FROM users;"],
    }, {
      self: adapter,
      args: ["COMMIT;"],
    }]);
  }
});

Deno.test("Adapter.transaction() -> should rollback transaction", async () => {
  for (const dialect of ["sqlite", "postgres", "mysql"]) {
    const query = spy();
    const adapter: Adapter = Object.assign(
      Object.create(Adapter.prototype),
      { query, dialect },
    );

    await assertThrowsAsync(
      async () => {
        await adapter.transaction(async () => {
          await adapter.query("SELECT * FROM users;");
          throw new Error("My error!");
        });
      },
      Error,
      "My error!",
    );

    assertEquals(query.calls, [{
      self: adapter,
      args: [
        dialect === "sqlite" ? "BEGIN TRANSACTION;" : "START TRANSACTION;",
      ],
    }, {
      self: adapter,
      args: ["SELECT * FROM users;"],
    }, {
      self: adapter,
      args: ["ROLLBACK;"],
    }]);
  }
});

testDB(
  "Adapter: table() -> should contains actual query builder",
  (client) => {
    const query = client.table("users");
    assert(query instanceof QueryBuilder);
    assertEquals((query as any).adapter, client);
  },
);

testDB(
  "Adapter: getManager() -> should return a model manager",
  (client) => {
    const manager = client.getManager();
    assert(manager instanceof Manager);
    assertEquals((manager as any).adapter, client);
  },
);

testDB("Adapter: query() -> bind values", async (client) => {
  let query: string;

  switch (client.dialect) {
    case "mysql":
    case "sqlite":
      query =
        "INSERT INTO users (first_name, last_name, age, created_at, is_active) VALUES (?, ?, ?, ?, ?)";
      break;
    case "postgres":
      query =
        "INSERT INTO users (first_name, last_name, age, created_at, is_active) VALUES ($1, $2, $3, $4, $5)";
      break;
  }

  const date = new Date();
  await client.query(query, [
    "John",
    "Doe",
    16,
    formatDate(date),
    client.dialect === "postgres" ? true : 1,
  ]);

  const result = await client.query(
    `SELECT id, first_name, last_name, age, created_at, is_active FROM users;`,
  );

  console.log(result);

  assertEquals(Array.isArray(result), true);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, 1);
  assertEquals(result[0].first_name, "John");
  assertEquals(result[0].last_name, "Doe");
  assertEquals(result[0].age, 16);
  if (client.dialect === "sqlite") {
    assertEquals(result[0].created_at, formatDate(date));
  } else {
    assertDateEquals(result[0].created_at as Date, date);
  }
  assertEquals(result[0].is_active, client.dialect === "postgres" ? true : 1);
});
