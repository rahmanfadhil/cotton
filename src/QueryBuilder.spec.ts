import { QueryBuilder } from "./QueryBuilder";

describe("QueryBuilder", () => {
  it("where", () => {
    const queryBuilder = new QueryBuilder("users").where(
      "email = ?",
      "a@b.com"
    );
    expect(queryBuilder.getSQL()).toBe(
      "SELECT * FROM users WHERE email = 'a@b.com';"
    );
  });

  it("andWhere", () => {
    const queryBuilder = new QueryBuilder("users")
      .where("email = ?", "a@b.com")
      .andWhere("name = ?", "John");
    expect(queryBuilder.getSQL()).toBe(
      "SELECT * FROM users WHERE email = 'a@b.com' AND name = 'John';"
    );
  });

  it("notWhere with where", () => {
    const queryBuilder = new QueryBuilder("users")
      .where("email = ?", "a@b.com")
      .notWhere("name = ?", "John");
    expect(queryBuilder.getSQL()).toBe(
      "SELECT * FROM users WHERE email = 'a@b.com' NOT name = 'John';"
    );
  });

  it("notWhere without where", () => {
    const queryBuilder = new QueryBuilder("users").notWhere(
      "email = ?",
      "a@b.com"
    );
    expect(queryBuilder.getSQL()).toBe(
      "SELECT * FROM users WHERE NOT email = 'a@b.com';"
    );
  });

  it("first", () => {
    const queryBuilder = new QueryBuilder("users")
      .where("email = ?", "a@b.com")
      .first();
    expect(queryBuilder.getSQL()).toBe(
      "SELECT * FROM users WHERE email = 'a@b.com' LIMIT 1;"
    );
  });

  it("limit", () => {
    const queryBuilder = new QueryBuilder("users")
      .where("email = ?", "a@b.com")
      .limit(5);
    expect(queryBuilder.getSQL()).toBe(
      "SELECT * FROM users WHERE email = 'a@b.com' LIMIT 5;"
    );
  });
});
