import { testDB } from "../testutils.ts";
import { assertEquals } from "../../testdeps.ts";
import { QueryBuilder } from "../querybuilder.ts";
import { formatDate } from "../utils/date.ts";

testDB(
  "BaseAdapter: `table` should contains actual query builder",
  (client) => {
    const query = client.table("users");
    assertEquals(query instanceof QueryBuilder, true);
  },
);

testDB("BaseAdapter: `query` bind values", async (client) => {
  let query: string;

  switch (client.dialect) {
    case "mysql":
    case "sqlite":
      query = "insert into users (email, age, created_at) values (?, ?, ?)";
      break;
    case "postgres":
      query = "insert into users (email, age, created_at) values ($1, $2, $3)";
      break;
  }

  await client.query(query, ["a@b.com", 16, formatDate(new Date())]);

  const result = await client.query(`select id, email, age from users;`);

  assertEquals(Array.isArray(result), true);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, 1);
  assertEquals(result[0].email, "a@b.com");
  assertEquals(result[0].age, 16);
});
