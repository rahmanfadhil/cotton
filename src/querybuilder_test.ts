import { QueryBuilder } from "./querybuilder.ts";
import { assertEquals, assertThrows } from "../testdeps.ts";

Deno.test("QueryBuilder: basic query", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .toSQL();
  assertEquals(query, "SELECT * FROM users WHERE email = 'a@b.com';");
});

Deno.test("QueryBuilder: multiple where query", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .where("name", "=", "john")
    .toSQL();
  assertEquals(
    query,
    "SELECT * FROM users WHERE email = 'a@b.com' AND name = 'john';",
  );
});

Deno.test("QueryBuilder: should validate where operation", () => {
  assertThrows(
    () => {
      new QueryBuilder("users").where(
        "email",
        "invalid operation" as any,
        "a@b.com",
      );
    },
    Error,
    "Invalid operation!",
  );
});

Deno.test("QueryBuilder: limit query", () => {
  const query = new QueryBuilder("users").limit(5).toSQL();
  assertEquals(query, "SELECT * FROM users LIMIT 5;");
});

Deno.test("QueryBuilder: limit query with offset", () => {
  const query = new QueryBuilder("users").limit(5).offset(5).toSQL();
  assertEquals(query, "SELECT * FROM users LIMIT 5 OFFSET 5;");
});

Deno.test("QueryBuilder: limit query with where", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .limit(5)
    .toSQL();
  assertEquals(query, "SELECT * FROM users WHERE email = 'a@b.com' LIMIT 5;");
});

Deno.test("QueryBuilder: select a column", () => {
  const query = new QueryBuilder("users").select("email").toSQL();
  assertEquals(query, "SELECT (email) FROM users;");
});

Deno.test("QueryBuilder: select multiple columns", () => {
  const query = new QueryBuilder("users").select("email", "password").toSQL();
  assertEquals(query, "SELECT (email, password) FROM users;");
});
