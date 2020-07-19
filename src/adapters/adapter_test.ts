import { testDB } from "../testutils.ts";
import { assertEquals, assert } from "../../testdeps.ts";
import { QueryBuilder } from "../querybuilder.ts";
import { formatDate } from "../utils/date.ts";

testDB(
  "BaseAdapter: `table` should contains actual query builder",
  (client) => {
    const query = client.table("users");
    assert(query instanceof QueryBuilder);
    assertEquals((query as any).adapter, client);
  },
);

testDB("BaseAdapter: `query` bind values", async (client) => {
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

  assertEquals(Array.isArray(result), true);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, 1);
  assertEquals(result[0].first_name, "John");
  assertEquals(result[0].last_name, "Doe");
  assertEquals(result[0].age, 16);
  assertEquals(
    result[0].created_at,
    client.dialect === "sqlite" ? formatDate(date) : date,
  );
  assertEquals(result[0].is_active, client.dialect === "postgres" ? true : 1);
});
