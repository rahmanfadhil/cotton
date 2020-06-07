import { QueryBuilder } from "./querybuilder.ts";
import { assertEquals, assertThrows } from "../testdeps.ts";
import { DateUtils } from "./utils/date.ts";

Deno.test("QueryBuilder: basic query", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .toSQL();
  assertEquals(query, "SELECT * FROM users WHERE email = 'a@b.com';");
});

Deno.test("QueryBuilder: basic query with default operation", () => {
  const query = new QueryBuilder("users")
    .where("email", "a@b.com")
    .toSQL();
  assertEquals(query, "SELECT * FROM users WHERE email = 'a@b.com';");
});

Deno.test("QueryBuilder: query with number value", () => {
  const query = new QueryBuilder("users")
    .where("age", "=", 13)
    .toSQL();
  assertEquals(query, "SELECT * FROM users WHERE age = 13;");
});

Deno.test("QueryBuilder: query with boolean true value", () => {
  const query = new QueryBuilder("users")
    .where("age", "=", true)
    .toSQL();
  assertEquals(query, "SELECT * FROM users WHERE age = 1;");
});

Deno.test("QueryBuilder: query with boolean true value", () => {
  const query = new QueryBuilder("users")
    .where("age", "=", false)
    .toSQL();
  assertEquals(query, "SELECT * FROM users WHERE age = 0;");
});

Deno.test("QueryBuilder: query with date value", () => {
  const date = new Date("14 January, 2004");
  const dateString = DateUtils.formatDate(date);

  const query = new QueryBuilder("users")
    .where("email", "a@b.com")
    .where("created_at", date)
    .toSQL();

  assertEquals(
    query,
    `SELECT * FROM users WHERE email = 'a@b.com' AND created_at = '${dateString}';`,
  );
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

Deno.test("QueryBuilder: where not query", () => {
  const query = new QueryBuilder("users")
    .notWhere("email", "=", "a@b.com")
    .toSQL();
  assertEquals(
    query,
    "SELECT * FROM users WHERE NOT email = 'a@b.com';",
  );
});

Deno.test("QueryBuilder: multiple where not query", () => {
  const query = new QueryBuilder("users")
    .notWhere("email", "=", "a@b.com")
    .notWhere("name", "=", "John")
    .toSQL();
  assertEquals(
    query,
    "SELECT * FROM users WHERE NOT email = 'a@b.com' AND NOT name = 'John';",
  );
});

Deno.test("QueryBuilder: where and where not query", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .notWhere("name", "=", "John")
    .toSQL();
  assertEquals(
    query,
    "SELECT * FROM users WHERE email = 'a@b.com' AND NOT name = 'John';",
  );
});

Deno.test("QueryBuilder: where ... or query", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .orWhere("name", "=", "John")
    .toSQL();
  assertEquals(
    query,
    "SELECT * FROM users WHERE email = 'a@b.com' OR name = 'John';",
  );
});

Deno.test("QueryBuilder: multiple where ... or query", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .orWhere("name", "=", "John")
    .orWhere("age", ">", 16)
    .toSQL();
  assertEquals(
    query,
    "SELECT * FROM users WHERE email = 'a@b.com' OR name = 'John' OR age > 16;",
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

Deno.test("QueryBuilder: orderBy default to ASC", () => {
  const query = new QueryBuilder("users").orderBy("created_at").toSQL();
  assertEquals(query, "SELECT * FROM users ORDER BY created_at ASC;");
});

Deno.test("QueryBuilder: single orderBy", () => {
  const query = new QueryBuilder("users").orderBy("created_at", "ASC").toSQL();
  assertEquals(query, "SELECT * FROM users ORDER BY created_at ASC;");
});

Deno.test("QueryBuilder: multiple orderBy", () => {
  const query = new QueryBuilder("users")
    .orderBy("created_at", "ASC")
    .orderBy("name", "DESC")
    .toSQL();

  assertEquals(
    query,
    "SELECT * FROM users ORDER BY created_at ASC, name DESC;",
  );
});

Deno.test("QueryBuilder: basic delete query", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .delete()
    .toSQL();
  assertEquals(query, "DELETE FROM users WHERE email = 'a@b.com';");
});

Deno.test("QueryBuilder: basic update query", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .update({ name: "John" })
    .toSQL();
  assertEquals(
    query,
    "UPDATE users SET name = 'John' WHERE email = 'a@b.com';",
  );
});

Deno.test("QueryBuilder: update query with number value", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .update({ name: "John", age: 16 })
    .toSQL();
  assertEquals(
    query,
    "UPDATE users SET name = 'John', age = 16 WHERE email = 'a@b.com';",
  );
});

Deno.test("QueryBuilder: update query with boolean false value", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .update({ name: "John", is_active: false })
    .toSQL();
  assertEquals(
    query,
    "UPDATE users SET name = 'John', is_active = 0 WHERE email = 'a@b.com';",
  );
});

Deno.test("QueryBuilder: update query with boolean true value", () => {
  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .update({ name: "John", is_active: true })
    .toSQL();
  assertEquals(
    query,
    "UPDATE users SET name = 'John', is_active = 1 WHERE email = 'a@b.com';",
  );
});

Deno.test("QueryBuilder: update query with date value", () => {
  const date = new Date("14 January, 2004");
  const dateString = DateUtils.formatDate(date);

  const query = new QueryBuilder("users")
    .where("email", "=", "a@b.com")
    .update({ name: "John", created_at: date })
    .toSQL();
  assertEquals(
    query,
    `UPDATE users SET name = 'John', created_at = '${dateString}' WHERE email = 'a@b.com';`,
  );
});

Deno.test("QueryBuilder: basic insert", () => {
  const query = new QueryBuilder("users")
    .insert({ email: "a@b.com", password: "12345" })
    .toSQL();

  assertEquals(
    query,
    "INSERT INTO users (email, password) VALUES ('a@b.com', '12345');",
  );
});

Deno.test("QueryBuilder: basic insert with number value", () => {
  const query = new QueryBuilder("users")
    .insert({ email: "a@b.com", age: 16 })
    .toSQL();

  assertEquals(
    query,
    "INSERT INTO users (email, age) VALUES ('a@b.com', 16);",
  );
});

Deno.test("QueryBuilder: basic insert with boolean true value", () => {
  const query = new QueryBuilder("users")
    .insert({ email: "a@b.com", is_active: true })
    .toSQL();

  assertEquals(
    query,
    "INSERT INTO users (email, is_active) VALUES ('a@b.com', 1);",
  );
});

Deno.test("QueryBuilder: basic insert with boolean false value", () => {
  const query = new QueryBuilder("users")
    .insert({ email: "a@b.com", is_active: false })
    .toSQL();

  assertEquals(
    query,
    "INSERT INTO users (email, is_active) VALUES ('a@b.com', 0);",
  );
});

Deno.test("QueryBuilder: basic insert with date value", () => {
  const date = new Date("14 January, 2004");
  const dateString = DateUtils.formatDate(date);

  const query = new QueryBuilder("users")
    .insert({ email: "a@b.com", created_at: date })
    .toSQL();

  assertEquals(
    query,
    `INSERT INTO users (email, created_at) VALUES ('a@b.com', '${dateString}');`,
  );
});

Deno.test("QueryBuilder: basic insert with returning", () => {
  const query = new QueryBuilder("users")
    .insert({ email: "a@b.com" })
    .returning("*")
    .toSQL();

  assertEquals(
    query,
    `INSERT INTO users (email) VALUES ('a@b.com') RETURNING *;`,
  );
});

Deno.test("QueryBuilder: basic insert with returning multiple columns", () => {
  const query = new QueryBuilder("users")
    .insert({ email: "a@b.com" })
    .returning("id", "email")
    .toSQL();

  assertEquals(
    query,
    `INSERT INTO users (email) VALUES ('a@b.com') RETURNING id, email;`,
  );
});

Deno.test("QueryBuilder: throw an error if the `insert` method gets called without any values", () => {
  assertThrows(
    () => {
      (new QueryBuilder("users") as any).insert().toSQL();
    },
    Error,
    "Cannot perform replace query without values!",
  );
});
