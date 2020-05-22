import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { QueryBuilder } from "./querybuilder.ts";

Deno.test("QueryBuilder.where", () => {
  const queryBuilder = new QueryBuilder("users").where(
    "email = ?",
    "a@b.com",
  );
  assertEquals(
    queryBuilder.getSQL(),
    "SELECT * FROM users WHERE email = 'a@b.com';",
  );
});

Deno.test("QueryBuilder.andWhere", () => {
  const queryBuilder = new QueryBuilder("users")
    .where("email = ?", "a@b.com")
    .andWhere("name = ?", "john");
  assertEquals(
    queryBuilder.getSQL(),
    "SELECT * FROM users WHERE email = 'a@b.com' AND name = 'john';",
  );
});

Deno.test("QueryBuilder.notWhere with where", () => {
  const queryBuilder = new QueryBuilder("users")
    .where("email = ?", "a@b.com")
    .notWhere("name = ?", "john");
  assertEquals(
    queryBuilder.getSQL(),
    "SELECT * FROM users WHERE email = 'a@b.com' NOT name = 'john';",
  );
});

Deno.test("QueryBuilder.notWhere without where", () => {
  const queryBuilder = new QueryBuilder("users")
    .notWhere("email = ?", "a@b.com");
  assertEquals(
    queryBuilder.getSQL(),
    "SELECT * FROM users WHERE NOT email = 'a@b.com';",
  );
});

Deno.test("QueryBuilder.first first", () => {
  const queryBuilder = new QueryBuilder("users")
    .where("email = ?", "a@b.com")
    .first();
  assertEquals(
    queryBuilder.getSQL(),
    "SELECT * FROM users WHERE email = 'a@b.com' LIMIT 1;",
  );
});

Deno.test("QueryBuilder.limit limit", () => {
  const queryBuilder = new QueryBuilder("users")
    .where("email = ?", "a@b.com")
    .limit(5);
  assertEquals(
    queryBuilder.getSQL(),
    "SELECT * FROM users WHERE email = 'a@b.com' LIMIT 5;",
  );
});
