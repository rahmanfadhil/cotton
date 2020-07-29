import { QueryType, WhereType, JoinType } from "./querybuilder.ts";
import { formatDate } from "./utils/date.ts";
import { testQueryCompiler } from "./testutils.ts";
import { assertThrows } from "../testdeps.ts";
import { QueryCompiler } from "./querycompiler.ts";

// --------------------------------------------------------------------------------
// SELECT
// --------------------------------------------------------------------------------

testQueryCompiler("basic `where`", {
  wheres: [{
    column: "email",
    value: "a@b.com",
    operator: "=",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`email` = ?;",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`email` = ?;",
    values: ["a@b.com"],
  },
  postgres: {
    text: 'SELECT "users".* FROM "users" WHERE "users"."email" = $1;',
    values: ["a@b.com"],
  },
});

testQueryCompiler("`where` with boolean true value", {
  wheres: [{
    column: "is_active",
    value: true,
    operator: "=",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`is_active` = 1;",
    values: [],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`is_active` = 1;",
    values: [],
  },
  postgres: {
    text: 'SELECT "users".* FROM "users" WHERE "users"."is_active" = TRUE;',
    values: [],
  },
});

testQueryCompiler("`where` with boolean false value", {
  wheres: [{
    column: "is_active",
    value: false,
    operator: "=",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`is_active` = 0;",
    values: [],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`is_active` = 0;",
    values: [],
  },
  postgres: {
    text: 'SELECT "users".* FROM "users" WHERE "users"."is_active" = FALSE;',
    values: [],
  },
});

testQueryCompiler("`where` with number value", {
  wheres: [{
    column: "age",
    value: 16,
    operator: "=",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`age` = ?;",
    values: [16],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`age` = ?;",
    values: [16],
  },
  postgres: {
    text: 'SELECT "users".* FROM "users" WHERE "users"."age" = $1;',
    values: [16],
  },
});

testQueryCompiler("`where` with date value", {
  wheres: [{
    column: "birthday",
    value: new Date("6 July, 2020"),
    operator: "=",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`birthday` = ?;",
    values: [formatDate(new Date("6 July, 2020"))],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`birthday` = ?;",
    values: [formatDate(new Date("6 July, 2020"))],
  },
  postgres: {
    text: 'SELECT "users".* FROM "users" WHERE "users"."birthday" = $1;',
    values: [formatDate(new Date("6 July, 2020"))],
  },
});

testQueryCompiler("`where` select columns", {
  columns: ["id", "email"],
}, {
  mysql: {
    text: "SELECT `users`.`id`, `users`.`email` FROM `users`;",
    values: [],
  },
  sqlite: {
    text: "SELECT `users`.`id`, `users`.`email` FROM `users`;",
    values: [],
  },
  postgres: {
    text: 'SELECT "users"."id", "users"."email" FROM "users";',
    values: [],
  },
});

testQueryCompiler("`where` select columns with alias", {
  columns: [["users.id", "users_id"], ["posts.title", "posts_title"]],
}, {
  mysql: {
    text:
      "SELECT `users`.`id` AS users_id, `posts`.`title` AS posts_title FROM `users`;",
    values: [],
  },
  sqlite: {
    text:
      "SELECT `users`.`id` AS users_id, `posts`.`title` AS posts_title FROM `users`;",
    values: [],
  },
  postgres: {
    text:
      'SELECT "users"."id" AS users_id, "posts"."title" AS posts_title FROM "users";',
    values: [],
  },
});

Deno.test("QueryCompiler: select columns with alias must have two values", () => {
  assertThrows(
    () => {
      new QueryCompiler({
        type: QueryType.Select,
        wheres: [],
        columns: [["users.id", "users_id"], ["posts.title"] as any],
        orders: [],
        returning: [],
        joins: [],
        tableName: "`users`",
        counts: [],
      }, "" as any).compile();
    },
    Error,
    "Alias must have two values!",
  );

  assertThrows(
    () => {
      new QueryCompiler({
        type: QueryType.Select,
        wheres: [],
        columns: [
          ["users.id", "users_id"],
          ["posts.title", "posts_title", "invalid"] as any,
        ],
        orders: [],
        returning: [],
        joins: [],
        tableName: "`users`",
        counts: [],
      }, "" as any).compile();
    },
    Error,
    "Alias must have two values!",
  );

  assertThrows(
    () => {
      new QueryCompiler({
        type: QueryType.Select,
        wheres: [],
        columns: [["users.id", "users_id"], [] as any],
        orders: [],
        returning: [],
        joins: [],
        tableName: "`users`",
        counts: [],
      }, "" as any).compile();
    },
    Error,
    "Alias must have two values!",
  );
});

testQueryCompiler("`where` in", {
  wheres: [{
    column: "role",
    value: ["guest", "author"],
    operator: "in",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`role` in (?, ?);",
    values: ["guest", "author"],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`role` in (?, ?);",
    values: ["guest", "author"],
  },
  postgres: {
    text: 'SELECT "users".* FROM "users" WHERE "users"."role" in ($1, $2);',
    values: ["guest", "author"],
  },
});

testQueryCompiler("`where` in number value", {
  wheres: [{
    column: "id",
    value: [5, 7, 11, 12],
    operator: "in",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`id` in (?, ?, ?, ?);",
    values: [5, 7, 11, 12],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`id` in (?, ?, ?, ?);",
    values: [5, 7, 11, 12],
  },
  postgres: {
    text:
      'SELECT "users".* FROM "users" WHERE "users"."id" in ($1, $2, $3, $4);',
    values: [5, 7, 11, 12],
  },
});

testQueryCompiler("`where` like", {
  wheres: [{
    column: "name",
    value: "%john%",
    operator: "like",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`name` like ?;",
    values: ["%john%"],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`name` like ?;",
    values: ["%john%"],
  },
  postgres: {
    text: 'SELECT "users".* FROM "users" WHERE "users"."name" like $1;',
    values: ["%john%"],
  },
});

testQueryCompiler("`where` between", {
  wheres: [{
    column: "age",
    value: [1, 5],
    operator: "between",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`age` between ? and ?;",
    values: [1, 5],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE `users`.`age` between ? and ?;",
    values: [1, 5],
  },
  postgres: {
    text:
      'SELECT "users".* FROM "users" WHERE "users"."age" between $1 and $2;',
    values: [1, 5],
  },
});

Deno.test("QueryCompiler: BETWEEN must have two values", () => {
  assertThrows(
    () => {
      new QueryCompiler({
        type: QueryType.Select,
        wheres: [{
          type: WhereType.Default,
          column: "age",
          operator: "between",
          value: [1, 2, 5],
        }],
        columns: [],
        orders: [],
        returning: [],
        joins: [],
        tableName: "`users`",
        counts: [],
      }, "" as any).compile();
    },
    Error,
    "BETWEEN must have two values!",
  );

  assertThrows(
    () => {
      new QueryCompiler({
        type: QueryType.Select,
        wheres: [{
          type: WhereType.Default,
          column: "age",
          operator: "between",
          value: [1],
        }],
        columns: [],
        orders: [],
        returning: [],
        joins: [],
        tableName: "`users`",
        counts: [],
      }, "" as any).compile();
    },
    Error,
    "BETWEEN must have two values!",
  );

  assertThrows(
    () => {
      new QueryCompiler({
        type: QueryType.Select,
        wheres: [{
          type: WhereType.Default,
          column: "age",
          operator: "between",
          value: "blah",
        }],
        columns: [],
        orders: [],
        returning: [],
        joins: [],
        tableName: "`users`",
        counts: [],
      }, "" as any).compile();
    },
    Error,
    "BETWEEN must have two values!",
  );
});

testQueryCompiler("`where` not", {
  wheres: [{
    type: WhereType.Not,
    column: "email",
    operator: "=",
    value: "a@b.com",
  }],
}, {
  mysql: {
    text: "SELECT `users`.* FROM `users` WHERE NOT `users`.`email` = ?;",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "SELECT `users`.* FROM `users` WHERE NOT `users`.`email` = ?;",
    values: ["a@b.com"],
  },
  postgres: {
    text: 'SELECT "users".* FROM "users" WHERE NOT "users"."email" = $1;',
    values: ["a@b.com"],
  },
});

testQueryCompiler("`where` and", {
  wheres: [{
    column: "name",
    operator: "=",
    value: "john",
    type: WhereType.Default,
  }, {
    column: "email",
    operator: "=",
    value: "a@b.com",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text:
      "SELECT `users`.* FROM `users` WHERE `users`.`name` = ? AND `users`.`email` = ?;",
    values: ["john", "a@b.com"],
  },
  sqlite: {
    text:
      "SELECT `users`.* FROM `users` WHERE `users`.`name` = ? AND `users`.`email` = ?;",
    values: ["john", "a@b.com"],
  },
  postgres: {
    text:
      'SELECT "users".* FROM "users" WHERE "users"."name" = $1 AND "users"."email" = $2;',
    values: ["john", "a@b.com"],
  },
});

testQueryCompiler("`where` or", {
  wheres: [{
    column: "name",
    operator: "=",
    value: "john",
    type: WhereType.Default,
  }, {
    type: WhereType.Or,
    column: "email",
    operator: "=",
    value: "a@b.com",
  }],
}, {
  mysql: {
    text:
      "SELECT `users`.* FROM `users` WHERE `users`.`name` = ? OR `users`.`email` = ?;",
    values: ["john", "a@b.com"],
  },
  sqlite: {
    text:
      "SELECT `users`.* FROM `users` WHERE `users`.`name` = ? OR `users`.`email` = ?;",
    values: ["john", "a@b.com"],
  },
  postgres: {
    text:
      'SELECT "users".* FROM "users" WHERE "users"."name" = $1 OR "users"."email" = $2;',
    values: ["john", "a@b.com"],
  },
});

testQueryCompiler("`where` and not", {
  wheres: [{
    column: "name",
    operator: "=",
    value: "john",
    type: WhereType.Default,
  }, {
    type: WhereType.Not,
    column: "email",
    operator: "=",
    value: "a@b.com",
  }],
}, {
  mysql: {
    text:
      "SELECT `users`.* FROM `users` WHERE `users`.`name` = ? AND NOT `users`.`email` = ?;",
    values: ["john", "a@b.com"],
  },
  sqlite: {
    text:
      "SELECT `users`.* FROM `users` WHERE `users`.`name` = ? AND NOT `users`.`email` = ?;",
    values: ["john", "a@b.com"],
  },
  postgres: {
    text:
      'SELECT "users".* FROM "users" WHERE "users"."name" = $1 AND NOT "users"."email" = $2;',
    values: ["john", "a@b.com"],
  },
});

testQueryCompiler("`count` should add COUNT statement", {
  counts: [{
    column: "name",
    distinct: false,
  }, {
    column: "id",
    distinct: true,
    as: "count",
  }],
}, {
  mysql: {
    text:
      "SELECT COUNT(`users`.`name`), COUNT(DISTINCT(`users`.`id`)) AS `count` FROM `users`;",
    values: [],
  },
  sqlite: {
    text:
      "SELECT COUNT(`users`.`name`), COUNT(DISTINCT(`users`.`id`)) AS `count` FROM `users`;",
    values: [],
  },
  postgres: {
    text:
      'SELECT COUNT("users"."name"), COUNT(DISTINCT("users"."id")) AS "count" FROM "users";',
    values: [],
  },
});

testQueryCompiler("`where` inner join", {
  tableName: "orders",
  joins: [{
    table: "users",
    type: JoinType.Inner,
    columnA: "orders.user_id",
    columnB: "users.id",
  }],
  columns: ["*", "users.id"],
}, {
  mysql: {
    text:
      "SELECT `orders`.*, `users`.`id` FROM `orders` INNER JOIN `users` ON `orders`.`user_id` = `users`.`id`;",
    values: [],
  },
  sqlite: {
    text:
      "SELECT `orders`.*, `users`.`id` FROM `orders` INNER JOIN `users` ON `orders`.`user_id` = `users`.`id`;",
    values: [],
  },
  postgres: {
    text:
      'SELECT "orders".*, "users"."id" FROM "orders" INNER JOIN "users" ON "orders"."user_id" = "users"."id";',
    values: [],
  },
});

testQueryCompiler("`where` left outer join", {
  tableName: "orders",
  joins: [{
    table: "users",
    type: JoinType.Left,
    columnA: "orders.user_id",
    columnB: "users.id",
  }],
  columns: ["*", "users.id"],
}, {
  mysql: {
    text:
      "SELECT `orders`.*, `users`.`id` FROM `orders` LEFT OUTER JOIN `users` ON `orders`.`user_id` = `users`.`id`;",
    values: [],
  },
  sqlite: {
    text:
      "SELECT `orders`.*, `users`.`id` FROM `orders` LEFT OUTER JOIN `users` ON `orders`.`user_id` = `users`.`id`;",
    values: [],
  },
  postgres: {
    text:
      'SELECT "orders".*, "users"."id" FROM "orders" LEFT OUTER JOIN "users" ON "orders"."user_id" = "users"."id";',
    values: [],
  },
});

testQueryCompiler("`where` right outer join", {
  tableName: "orders",
  joins: [{
    table: "users",
    type: JoinType.Right,
    columnA: "orders.user_id",
    columnB: "users.id",
  }],
  columns: ["*", "users.id"],
}, {
  mysql: {
    text:
      "SELECT `orders`.*, `users`.`id` FROM `orders` RIGHT OUTER JOIN `users` ON `orders`.`user_id` = `users`.`id`;",
    values: [],
  },
  sqlite: {
    text:
      "SELECT `orders`.*, `users`.`id` FROM `orders` RIGHT OUTER JOIN `users` ON `orders`.`user_id` = `users`.`id`;",
    values: [],
  },
  postgres: {
    text:
      'SELECT "orders".*, "users"."id" FROM "orders" RIGHT OUTER JOIN "users" ON "orders"."user_id" = "users"."id";',
    values: [],
  },
});

testQueryCompiler("`where` full outer join", {
  tableName: "orders",
  joins: [{
    table: "users",
    type: JoinType.Full,
    columnA: "orders.user_id",
    columnB: "users.id",
  }],
  columns: ["*", "users.id"],
}, {
  mysql: {
    text:
      "SELECT `orders`.*, `users`.`id` FROM `orders` FULL OUTER JOIN `users` ON `orders`.`user_id` = `users`.`id`;",
    values: [],
  },
  sqlite: {
    text:
      "SELECT `orders`.*, `users`.`id` FROM `orders` FULL OUTER JOIN `users` ON `orders`.`user_id` = `users`.`id`;",
    values: [],
  },
  postgres: {
    text:
      'SELECT "orders".*, "users"."id" FROM "orders" FULL OUTER JOIN "users" ON "orders"."user_id" = "users"."id";',
    values: [],
  },
});

// --------------------------------------------------------------------------------
// DELETE
// --------------------------------------------------------------------------------

Deno.test("QueryCompiler: cannot perform `delete` without any constraints", () => {
  assertThrows(
    () => {
      new QueryCompiler({
        type: QueryType.Delete,
        wheres: [],
        columns: [],
        orders: [],
        returning: [],
        joins: [],
        tableName: "`users`",
        counts: [],
      }, "" as any).compile();
    },
    Error,
    "Cannot perform delete without any constraints!",
  );
});

testQueryCompiler("`delete` and `where`", {
  type: QueryType.Delete,
  wheres: [{
    column: "email",
    operator: "=",
    value: "a@b.com",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "DELETE FROM `users` WHERE `users`.`email` = ?;",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "DELETE FROM `users` WHERE `users`.`email` = ?;",
    values: ["a@b.com"],
  },
  postgres: {
    text: 'DELETE FROM "users" WHERE "users"."email" = $1;',
    values: ["a@b.com"],
  },
});

// --------------------------------------------------------------------------------
// INSERT
// --------------------------------------------------------------------------------

testQueryCompiler("`insert` should have no respect to where clauses", {
  type: QueryType.Insert,
  wheres: [{
    column: "email",
    operator: "=",
    value: "a@b.com",
    type: WhereType.Default,
  }],
  values: { email: "a@b.com" },
}, {
  mysql: {
    text: "INSERT INTO `users` (`email`) VALUES (?);",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "INSERT INTO `users` (`email`) VALUES (?);",
    values: ["a@b.com"],
  },
  postgres: {
    text: 'INSERT INTO "users" ("email") VALUES ($1);',
    values: ["a@b.com"],
  },
});

testQueryCompiler("basic `insert`", {
  type: QueryType.Insert,
  values: {
    email: "a@b.com",
    age: 16,
    is_active: true,
    birthday: new Date("6 July, 2020"),
  },
}, {
  mysql: {
    text:
      "INSERT INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?);",
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
  sqlite: {
    text:
      "INSERT INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?);",
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
  postgres: {
    text:
      'INSERT INTO "users" ("email", "age", "is_active", "birthday") VALUES ($1, $2, TRUE, $3);',
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
});

testQueryCompiler("`insert` with returning", {
  type: QueryType.Insert,
  values: {
    email: "a@b.com",
    age: 16,
    is_active: true,
    birthday: new Date("6 July, 2020"),
  },
  returning: ["id", "name"],
}, {
  mysql: {
    text:
      "INSERT INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?) RETURNING `id`, `name`;",
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
  sqlite: {
    text:
      "INSERT INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?) RETURNING `id`, `name`;",
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
  postgres: {
    text:
      'INSERT INTO "users" ("email", "age", "is_active", "birthday") VALUES ($1, $2, TRUE, $3) RETURNING "id", "name";',
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
});

testQueryCompiler("`insert` multiple", {
  type: QueryType.Insert,
  values: [{
    email: "a@b.com",
    age: 16,
    is_active: true,
    birthday: new Date("6 July, 2020"),
  }, {
    email: "b@c.com",
    age: 17,
    is_active: false,
    birthday: new Date("7 July, 2020"),
  }],
}, {
  mysql: {
    text:
      "INSERT INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?), (?, ?, 0, ?);",
    values: [
      "a@b.com",
      16,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      "2020-07-07 00:00:00",
    ],
  },
  sqlite: {
    text:
      "INSERT INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?), (?, ?, 0, ?);",
    values: [
      "a@b.com",
      16,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      "2020-07-07 00:00:00",
    ],
  },
  postgres: {
    text:
      'INSERT INTO "users" ("email", "age", "is_active", "birthday") VALUES ($1, $2, TRUE, $3), ($4, $5, FALSE, $6);',
    values: [
      "a@b.com",
      16,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      "2020-07-07 00:00:00",
    ],
  },
});

testQueryCompiler(
  "`insert` multiple should say NULL if the value is either null or undefined",
  {
    type: QueryType.Insert,
    values: [{
      email: "b@c.com",
    }, {
      age: 16,
    }, {
      email: "a@b.com",
      age: 16,
    }],
  },
  {
    mysql: {
      text:
        "INSERT INTO `users` (`email`, `age`) VALUES (?, NULL), (NULL, ?), (?, ?);",
      values: ["b@c.com", 16, "a@b.com", 16],
    },
    sqlite: {
      text:
        "INSERT INTO `users` (`email`, `age`) VALUES (?, NULL), (NULL, ?), (?, ?);",
      values: ["b@c.com", 16, "a@b.com", 16],
    },
    postgres: {
      text:
        'INSERT INTO "users" ("email", "age") VALUES ($1, NULL), (NULL, $2), ($3, $4);',
      values: ["b@c.com", 16, "a@b.com", 16],
    },
  },
);

// --------------------------------------------------------------------------------
// REPLACE
// --------------------------------------------------------------------------------

testQueryCompiler("`replace` should have no respect to where clauses", {
  type: QueryType.Replace,
  wheres: [{
    column: "email",
    operator: "=",
    value: "a@b.com",
    type: WhereType.Default,
  }],
  values: { email: "a@b.com" },
}, {
  mysql: {
    text: "REPLACE INTO `users` (`email`) VALUES (?);",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "REPLACE INTO `users` (`email`) VALUES (?);",
    values: ["a@b.com"],
  },
  postgres: {
    text: 'REPLACE INTO "users" ("email") VALUES ($1);',
    values: ["a@b.com"],
  },
});

testQueryCompiler("basic `replace`", {
  type: QueryType.Replace,
  values: {
    email: "a@b.com",
    age: 16,
    is_active: true,
    birthday: new Date("6 July, 2020"),
  },
}, {
  mysql: {
    text:
      "REPLACE INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?);",
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
  sqlite: {
    text:
      "REPLACE INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?);",
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
  postgres: {
    text:
      'REPLACE INTO "users" ("email", "age", "is_active", "birthday") VALUES ($1, $2, TRUE, $3);',
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
});

testQueryCompiler("`replace` with returning", {
  type: QueryType.Replace,
  values: {
    email: "a@b.com",
    age: 16,
    is_active: true,
    birthday: new Date("6 July, 2020"),
  },
  returning: ["id", "name"],
}, {
  mysql: {
    text:
      "REPLACE INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?) RETURNING `id`, `name`;",
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
  sqlite: {
    text:
      "REPLACE INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?) RETURNING `id`, `name`;",
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
  postgres: {
    text:
      'REPLACE INTO "users" ("email", "age", "is_active", "birthday") VALUES ($1, $2, TRUE, $3) RETURNING "id", "name";',
    values: ["a@b.com", 16, "2020-07-06 00:00:00"],
  },
});

testQueryCompiler("`replace` multiple", {
  type: QueryType.Replace,
  values: [{
    email: "a@b.com",
    age: 16,
    is_active: true,
    birthday: new Date("6 July, 2020"),
  }, {
    email: "b@c.com",
    age: 17,
    is_active: false,
    birthday: new Date("7 July, 2020"),
  }],
}, {
  mysql: {
    text:
      "REPLACE INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?), (?, ?, 0, ?);",
    values: [
      "a@b.com",
      16,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      "2020-07-07 00:00:00",
    ],
  },
  sqlite: {
    text:
      "REPLACE INTO `users` (`email`, `age`, `is_active`, `birthday`) VALUES (?, ?, 1, ?), (?, ?, 0, ?);",
    values: [
      "a@b.com",
      16,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      "2020-07-07 00:00:00",
    ],
  },
  postgres: {
    text:
      'REPLACE INTO "users" ("email", "age", "is_active", "birthday") VALUES ($1, $2, TRUE, $3), ($4, $5, FALSE, $6);',
    values: [
      "a@b.com",
      16,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      "2020-07-07 00:00:00",
    ],
  },
});

testQueryCompiler(
  "`replace` multiple should say NULL if the value is either null or undefined",
  {
    type: QueryType.Replace,
    values: [{
      email: "b@c.com",
    }, {
      age: 16,
    }, {
      email: "a@b.com",
      age: 16,
    }],
  },
  {
    mysql: {
      text:
        "REPLACE INTO `users` (`email`, `age`) VALUES (?, NULL), (NULL, ?), (?, ?);",
      values: ["b@c.com", 16, "a@b.com", 16],
    },
    sqlite: {
      text:
        "REPLACE INTO `users` (`email`, `age`) VALUES (?, NULL), (NULL, ?), (?, ?);",
      values: ["b@c.com", 16, "a@b.com", 16],
    },
    postgres: {
      text:
        'REPLACE INTO "users" ("email", "age") VALUES ($1, NULL), (NULL, $2), ($3, $4);',
      values: ["b@c.com", 16, "a@b.com", 16],
    },
  },
);

// --------------------------------------------------------------------------------
// UPDATE
// --------------------------------------------------------------------------------

testQueryCompiler("basic `update`", {
  type: QueryType.Update,
  wheres: [{
    column: "email",
    operator: "=",
    value: "a@b.com",
    type: WhereType.Default,
  }],
  values: {
    email: "b@c.com",
    age: 16,
    is_active: true,
    birthday: new Date("6 July, 2020"),
  },
}, {
  mysql: {
    text:
      "UPDATE `users` SET `email` = ?, `age` = ?, `is_active` = 1, `birthday` = ? WHERE `users`.`email` = ?;",
    values: ["b@c.com", 16, "2020-07-06 00:00:00", "a@b.com"],
  },
  sqlite: {
    text:
      "UPDATE `users` SET `email` = ?, `age` = ?, `is_active` = 1, `birthday` = ? WHERE `users`.`email` = ?;",
    values: ["b@c.com", 16, "2020-07-06 00:00:00", "a@b.com"],
  },
  postgres: {
    text:
      'UPDATE "users" SET "email" = $1, "age" = $2, "is_active" = TRUE, "birthday" = $3 WHERE "users"."email" = $4;',
    values: ["b@c.com", 16, "2020-07-06 00:00:00", "a@b.com"],
  },
});
