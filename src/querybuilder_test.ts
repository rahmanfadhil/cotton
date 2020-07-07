import { WhereType, QueryType, QueryBuilder } from "./querybuilder.ts";
import { testQueryBuilder } from "./testutils.ts";

// Where

testQueryBuilder(
  "basic `where`",
  (query) => query.where("email", "a@b.com"),
  {
    wheres: [{
      column: "email",
      operator: "=",
      value: "a@b.com",
      type: WhereType.Default,
    }],
  },
);

testQueryBuilder(
  "`where` with custom operator",
  (query) => query.where("age", ">", 16),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
  },
);

testQueryBuilder(
  "`where` with multiple values",
  (query) => query.where("id", "in", [1, 2, 3]),
  {
    wheres: [{
      type: WhereType.Default,
      column: "id",
      operator: "in",
      value: [1, 2, 3],
    }],
  },
);

testQueryBuilder(
  "multiple `where` clauses",
  (query) =>
    query
      .where("email", "a@b.com")
      .where("age", ">", 16)
      .where("is_active", true)
      .where("birthday", new Date("7 July, 2020")),
  {
    wheres: [{
      type: WhereType.Default,
      operator: "=",
      column: "email",
      value: "a@b.com",
    }, {
      type: WhereType.Default,
      operator: ">",
      column: "age",
      value: 16,
    }, {
      type: WhereType.Default,
      operator: "=",
      column: "is_active",
      value: true,
    }, {
      type: WhereType.Default,
      operator: "=",
      column: "birthday",
      value: new Date("7 July, 2020"),
    }],
  },
);

testQueryBuilder(
  "`or`",
  (query) => query.or("email", "a@b.com"),
  {
    wheres: [{
      type: WhereType.Or,
      column: "email",
      operator: "=",
      value: "a@b.com",
    }],
  },
);

testQueryBuilder(
  "`or` with custom operator",
  (query) => query.or("age", ">", 16),
  {
    wheres: [{
      type: WhereType.Or,
      column: "age",
      operator: ">",
      value: 16,
    }],
  },
);

testQueryBuilder(
  "`not`",
  (query) => query.not("email", "a@b.com"),
  {
    wheres: [{
      type: WhereType.Not,
      column: "email",
      operator: "=",
      value: "a@b.com",
    }],
  },
);

testQueryBuilder(
  "`not` with custom operator",
  (query) => query.not("age", ">", 16),
  {
    wheres: [{
      type: WhereType.Not,
      column: "age",
      operator: ">",
      value: 16,
    }],
  },
);

testQueryBuilder(
  "`or` and `not`",
  (query) =>
    query
      .where("email", "a@b.com")
      .or("name", "like", "%john%")
      .not("age", ">", 16),
  {
    wheres: [{
      type: WhereType.Default,
      column: "email",
      operator: "=",
      value: "a@b.com",
    }, {
      type: WhereType.Or,
      column: "name",
      operator: "like",
      value: "%john%",
    }, {
      type: WhereType.Not,
      column: "age",
      operator: ">",
      value: 16,
    }],
  },
);

// Pagination

testQueryBuilder(
  "`limit` should set the record limit",
  (query) => query.where("age", ">", 16).limit(10),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    limit: 10,
  },
);

testQueryBuilder(
  "`offset` should set the number of records to skip",
  (query) => query.where("age", ">", 16).offset(5),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    offset: 5,
  },
);

testQueryBuilder(
  "`limit` and `offset`",
  (query) => query.where("age", ">", 16).limit(7).offset(14),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    limit: 7,
    offset: 14,
  },
);

testQueryBuilder(
  "`first` should be the shortcut for limit(1)",
  (query) => query.where("age", ">", 16).first(),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    limit: 1,
  },
);

// Select

testQueryBuilder(
  "`select` should add the list of all selected columns",
  (query) => query.where("age", ">", 16).select("email"),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    columns: ["email"],
  },
);

testQueryBuilder(
  "`select` multiple columns",
  (query) =>
    query.where("age", ">", 16)
      .select("email")
      .select("age")
      .select("is_active"),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    columns: ["email", "age", "is_active"],
  },
);

testQueryBuilder(
  "`select` multiple columns with a single method",
  (query) => query.where("age", ">", 16).select("email", "age", "is_active"),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    columns: ["email", "age", "is_active"],
  },
);

// Order by

testQueryBuilder(
  "`orderBy` should order the result",
  (query) => query.where("age", ">", 16).orderBy("age"),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    orders: [{ column: "age", order: "ASC" }],
  },
);

testQueryBuilder(
  "`orderBy` should order the result with custom direction",
  (query) => query.where("age", ">", 16).orderBy("age", "DESC"),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
    orders: [{ column: "age", order: "DESC" }],
  },
);

testQueryBuilder(
  "multiple `orderBy`",
  (query) =>
    query.where("age", ">", 16).orderBy("age", "DESC").orderBy("created_at"),
  {
    wheres: [{
      type: WhereType.Default,
      column: "age",
      operator: ">",
      value: 16,
    }],
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
  (query) => query.where("email", "a@b.com").delete(),
  {
    wheres: [{
      type: WhereType.Default,
      column: "email",
      operator: "=",
      value: "a@b.com",
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
      .where("email", "a@b.com")
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
      operator: "=",
      value: "a@b.com",
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
