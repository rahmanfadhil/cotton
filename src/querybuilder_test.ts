import { JoinType, QueryType, WhereType } from "./querybuilder.ts";
import { testQueryBuilder } from "./testutils.ts";
import { Q, QueryOperator } from "./q.ts";

// Where

testQueryBuilder(
  "basic `where`",
  (query) => query.where("email", "a@b.com"),
  {
    wheres: [{
      type: WhereType.Default,
      column: "email",
      expression: Q.eq("a@b.com"),
    }],
  },
);

testQueryBuilder(
  "`where` with custom expression",
  (query) => query.where("age", Q.gt(16)),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      expression: Q.gt(16),
    }],
  },
);

testQueryBuilder(
  "multiple `where` clauses",
  (query) =>
    query
      .where("email", Q.eq("a@b.com"))
      .where("age", Q.gt(16))
      .where("is_active", Q.eq(true))
      .where("birthday", Q.eq(new Date("7 July, 2020"))),
  {
    wheres: [{
      type: WhereType.Default,
      column: "email",
      expression: Q.eq("a@b.com"),
    }, {
      type: WhereType.Default,
      column: "age",
      expression: Q.gt(16),
    }, {
      type: WhereType.Default,
      column: "is_active",
      expression: Q.eq(true),
    }, {
      type: WhereType.Default,
      column: "birthday",
      expression: {
        operator: QueryOperator.Equal,
        value: new Date("7 July, 2020"),
      },
    }],
  },
);

testQueryBuilder(
  "`or`",
  (query) => query.or("email", Q.eq("a@b.com")),
  {
    wheres: [{
      type: WhereType.Or,
      column: "email",
      expression: Q.eq("a@b.com"),
    }],
  },
);

testQueryBuilder(
  "`not`",
  (query) => query.not("email", Q.eq("a@b.com")),
  {
    wheres: [{
      type: WhereType.Not,
      column: "email",
      expression: Q.eq("a@b.com"),
    }],
  },
);

testQueryBuilder(
  "`or` and `not`",
  (query) =>
    query
      .where("email", Q.eq("a@b.com"))
      .or("name", Q.like("%john%"))
      .not("age", Q.gt(16)),
  {
    wheres: [{
      type: WhereType.Default,
      column: "email",
      expression: Q.eq("a@b.com"),
    }, {
      type: WhereType.Or,
      column: "name",
      expression: Q.like("%john%"),
    }, {
      type: WhereType.Not,
      column: "age",
      expression: Q.gt(16),
    }],
  },
);

testQueryBuilder(
  "`distinct` should enable distinct select",
  (query) => query.distinct(),
  { isDistinct: true },
);

// Count

testQueryBuilder(
  "`count` should count records with given conditions",
  (query) => query.count("name"),
  { counts: [{ columns: ["name"], distinct: false }] },
);

testQueryBuilder(
  "`count` should count with alias",
  (query) => query.count("name", "count"),
  { counts: [{ columns: ["name"], as: "count", distinct: false }] },
);

testQueryBuilder(
  "`countDistinct` should count with distinct",
  (query) => query.countDistinct("name"),
  { counts: [{ columns: ["name"], distinct: true }] },
);

testQueryBuilder(
  "`countDistinct` should count with distinct and alias",
  (query) => query.countDistinct("name", "count"),
  { counts: [{ columns: ["name"], as: "count", distinct: true }] },
);

// Pagination

testQueryBuilder(
  "`limit` should set the record limit",
  (query) => query.limit(10),
  { limit: 10 },
);

testQueryBuilder(
  "`offset` should set the number of records to skip",
  (query) => query.offset(5),
  { offset: 5 },
);

testQueryBuilder(
  "`limit` and `offset`",
  (query) => query.limit(7).offset(14),
  { limit: 7, offset: 14 },
);

testQueryBuilder(
  "`first` should be the shortcut for limit(1)",
  (query) => query.first(),
  { limit: 1 },
);

// Select

testQueryBuilder(
  "`select` should add the list of all selected columns",
  (query) => query.select("email"),
  { columns: ["email"] },
);

testQueryBuilder(
  "`select` multiple columns",
  (query) => query.select("email").select("age").select("is_active"),
  { columns: ["email", "age", "is_active"] },
);

testQueryBuilder(
  "`select` multiple columns with a single method",
  (query) => query.select("email", "age", "is_active"),
  { columns: ["email", "age", "is_active"] },
);

testQueryBuilder(
  "`select` multiple columns with aliases",
  (query) => query.select(["email", "my_email"], ["age", "my_age"]),
  { columns: [["email", "my_email"], ["age", "my_age"]] },
);

// Group by

testQueryBuilder(
  "`groupBy` should add the list of all grouped columns",
  (query) => query.groupBy("email"),
  { groupBy: ["email"] },
);

testQueryBuilder(
  "`groupBy` multiple columns",
  (query) => query.groupBy("email").groupBy("age").groupBy("is_active"),
  { groupBy: ["email", "age", "is_active"] },
);

testQueryBuilder(
  "`groupBy` multiple columns with a single method",
  (query) => query.groupBy("email", "age", "is_active"),
  { groupBy: ["email", "age", "is_active"] },
);

// Having

testQueryBuilder(
  "basic `having`",
  (query) => query.having("email", "a@b.com"),
  {
    havings: [{
      column: "email",
      expression: Q.eq("a@b.com"),
      type: WhereType.Default,
    }],
  },
);

testQueryBuilder(
  "`having` with custom expression",
  (query) => query.having("age", Q.gt(16)),
  {
    havings: [{
      column: "age",
      expression: Q.gt(16),
      type: WhereType.Default,
    }],
  },
);

testQueryBuilder(
  "multiple `having` clauses",
  (query) =>
    query
      .having("email", Q.eq("a@b.com"))
      .having("age", Q.gt(16))
      .having("is_active", Q.eq(true))
      .having("birthday", Q.eq(new Date("7 July, 2020"))),
  {
    havings: [{
      column: "email",
      expression: Q.eq("a@b.com"),
      type: WhereType.Default,
    }, {
      column: "age",
      expression: Q.gt(16),
      type: WhereType.Default,
    }, {
      column: "is_active",
      expression: Q.eq(true),
      type: WhereType.Default,
    }, {
      column: "birthday",
      expression: Q.eq(new Date("7 July, 2020")),
      type: WhereType.Default,
    }],
  },
);

// Joins

testQueryBuilder(
  "basic `innerJoin`",
  (query) => query.innerJoin("companies", "users.company_id", "companies.id"),
  {
    joins: [{
      type: JoinType.Inner,
      table: "companies",
      columnA: "users.company_id",
      columnB: "companies.id",
    }],
  },
);

testQueryBuilder(
  "basic `fullJoin`",
  (query) => query.fullJoin("companies", "users.company_id", "companies.id"),
  {
    joins: [{
      type: JoinType.Full,
      table: "companies",
      columnA: "users.company_id",
      columnB: "companies.id",
    }],
  },
);

testQueryBuilder(
  "basic `leftJoin`",
  (query) => query.leftJoin("companies", "users.company_id", "companies.id"),
  {
    joins: [{
      type: JoinType.Left,
      table: "companies",
      columnA: "users.company_id",
      columnB: "companies.id",
    }],
  },
);

testQueryBuilder(
  "basic `rightJoin`",
  (query) => query.rightJoin("companies", "users.company_id", "companies.id"),
  {
    joins: [{
      type: JoinType.Right,
      table: "companies",
      columnA: "users.company_id",
      columnB: "companies.id",
    }],
  },
);

// Order by

testQueryBuilder(
  "`order` should order the result",
  (query) => query.order("age"),
  { orders: [{ column: "age", order: "ASC" }] },
);

testQueryBuilder(
  "`order` should order the result with custom direction",
  (query) => query.order("age", "DESC"),
  { orders: [{ column: "age", order: "DESC" }] },
);

testQueryBuilder(
  "multiple `order`",
  (query) => query.order("age", "DESC").order("created_at"),
  {
    orders: [{
      column: "age",
      order: "DESC",
    }, {
      column: "created_at",
      order: "ASC",
    }],
  },
);

// Delete

testQueryBuilder(
  "basic `delete`",
  (query) => query.where("email", Q.eq("a@b.com")).delete(),
  {
    wheres: [{
      type: WhereType.Default,
      column: "email",
      expression: Q.eq("a@b.com"),
    }],
    type: QueryType.Delete,
  },
);

// Update

// TODO: throw an error if the `update` method gets called without any values
// TODO: throw an error if the `update` method gets called with an empty object

testQueryBuilder(
  "basic `update`",
  (query) =>
    query
      .where("email", Q.eq("a@b.com"))
      .update({
        name: "John",
        age: 16,
        is_active: true,
        birthday: new Date("7 July, 2020"),
      }),
  {
    wheres: [{
      type: WhereType.Default,
      column: "email",
      expression: Q.eq("a@b.com"),
    }],
    values: {
      name: "John",
      age: 16,
      is_active: true,
      birthday: new Date("7 July, 2020"),
    },
    type: QueryType.Update,
  },
);

// Insert

// TODO: throw an error if the `insert` method gets called without any values
// TODO: throw an error if the `insert` method gets called with an empty object
// TODO: throw an error if the `insert` method gets called with an empty array
// TODO: throw an error if the `insert` method gets called with an empty array of objects

testQueryBuilder(
  "basic `insert`",
  (query) =>
    query.insert({
      name: "John",
      age: 16,
      is_active: true,
      birthday: new Date("7 July, 2020"),
    }),
  {
    values: {
      name: "John",
      age: 16,
      is_active: true,
      birthday: new Date("7 July, 2020"),
    },
    type: QueryType.Insert,
  },
);

testQueryBuilder(
  "`insert` with multiple values",
  (query) =>
    query
      .insert([{
        name: "John",
        age: 16,
        is_active: true,
        birthday: new Date("7 July, 2020"),
      }, {
        name: "Doe",
        age: 17,
        is_active: false,
        birthday: new Date("8 July, 2020"),
      }]),
  {
    values: [{
      name: "John",
      age: 16,
      is_active: true,
      birthday: new Date("7 July, 2020"),
    }, {
      name: "Doe",
      age: 17,
      is_active: false,
      birthday: new Date("8 July, 2020"),
    }],
    type: QueryType.Insert,
  },
);

testQueryBuilder(
  "`insert` with returning all columns",
  (query) => query.insert({ email: "a@b.com" }).returning("*"),
  {
    values: { email: "a@b.com" },
    returning: ["*"],
    type: QueryType.Insert,
  },
);

testQueryBuilder(
  "`insert` with returning several columns",
  (query) => query.insert({ email: "a@b.com" }).returning("email", "age"),
  {
    values: { email: "a@b.com" },
    returning: ["email", "age"],
    type: QueryType.Insert,
  },
);

// Replace

// TODO: throw an error if the `replace` method gets called without any values
// TODO: throw an error if the `replace` method gets called with an empty object
// TODO: throw an error if the `replace` method gets called with an empty array
// TODO: throw an error if the `replace` method gets called with an empty array of objects

testQueryBuilder(
  "basic `replace`",
  (query) =>
    query.replace({
      name: "John",
      age: 16,
      is_active: true,
      birthday: new Date("7 July, 2020"),
    }),
  {
    values: {
      name: "John",
      age: 16,
      is_active: true,
      birthday: new Date("7 July, 2020"),
    },
    type: QueryType.Replace,
  },
);

testQueryBuilder(
  "`replace` with returning all columns",
  (query) => query.replace({ email: "a@b.com" }).returning("*"),
  {
    values: { email: "a@b.com" },
    returning: ["*"],
    type: QueryType.Replace,
  },
);

testQueryBuilder(
  "`replace` with returning several columns",
  (query) => query.replace({ email: "a@b.com" }).returning("email", "age"),
  {
    values: { email: "a@b.com" },
    returning: ["email", "age"],
    type: QueryType.Replace,
  },
);
