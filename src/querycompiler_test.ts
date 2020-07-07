import { QueryType, WhereType } from "./querybuilder.ts";
import { DateUtils } from "./utils/date.ts";
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
    text: "SELECT * FROM users WHERE email = ?;",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE email = ?;",
    values: ["a@b.com"],
  },
  postgres: {
    text: "SELECT * FROM users WHERE email = $1;",
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
    text: "SELECT * FROM users WHERE is_active = ?;",
    values: [1],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE is_active = ?;",
    values: [1],
  },
  postgres: {
    text: "SELECT * FROM users WHERE is_active = $1;",
    values: [true],
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
    text: "SELECT * FROM users WHERE is_active = ?;",
    values: [0],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE is_active = ?;",
    values: [0],
  },
  postgres: {
    text: "SELECT * FROM users WHERE is_active = $1;",
    values: [false],
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
    text: "SELECT * FROM users WHERE age = ?;",
    values: [16],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE age = ?;",
    values: [16],
  },
  postgres: {
    text: "SELECT * FROM users WHERE age = $1;",
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
    text: "SELECT * FROM users WHERE birthday = ?;",
    values: [DateUtils.formatDate(new Date("6 July, 2020"))],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE birthday = ?;",
    values: [DateUtils.formatDate(new Date("6 July, 2020"))],
  },
  postgres: {
    text: "SELECT * FROM users WHERE birthday = $1;",
    values: [DateUtils.formatDate(new Date("6 July, 2020"))],
  },
});

testQueryCompiler("`where` in", {
  wheres: [{
    column: "role",
    value: ["guest", "author"],
    operator: "IN",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT * FROM users WHERE role IN (?, ?);",
    values: ["guest", "author"],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE role IN (?, ?);",
    values: ["guest", "author"],
  },
  postgres: {
    text: "SELECT * FROM users WHERE role IN ($1, $2);",
    values: ["guest", "author"],
  },
});

testQueryCompiler("`where` in number value", {
  wheres: [{
    column: "id",
    value: [5, 7, 11, 12],
    operator: "IN",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT * FROM users WHERE id IN (?, ?, ?, ?);",
    values: [5, 7, 11, 12],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE id IN (?, ?, ?, ?);",
    values: [5, 7, 11, 12],
  },
  postgres: {
    text: "SELECT * FROM users WHERE id IN ($1, $2, $3, $4);",
    values: [5, 7, 11, 12],
  },
});

testQueryCompiler("`where` like", {
  wheres: [{
    column: "name",
    value: "%john%",
    operator: "LIKE",
    type: WhereType.Default,
  }],
}, {
  mysql: {
    text: "SELECT * FROM users WHERE name LIKE ?;",
    values: ["%john%"],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE name LIKE ?;",
    values: ["%john%"],
  },
  postgres: {
    text: "SELECT * FROM users WHERE name LIKE $1;",
    values: ["%john%"],
  },
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
    text: "SELECT * FROM users WHERE NOT email = ?;",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE NOT email = ?;",
    values: ["a@b.com"],
  },
  postgres: {
    text: "SELECT * FROM users WHERE NOT email = $1;",
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
    text: "SELECT * FROM users WHERE name = ? AND email = ?;",
    values: ["john", "a@b.com"],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE name = ? AND email = ?;",
    values: ["john", "a@b.com"],
  },
  postgres: {
    text: "SELECT * FROM users WHERE name = $1 AND email = $2;",
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
    text: "SELECT * FROM users WHERE name = ? OR email = ?;",
    values: ["john", "a@b.com"],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE name = ? OR email = ?;",
    values: ["john", "a@b.com"],
  },
  postgres: {
    text: "SELECT * FROM users WHERE name = $1 OR email = $2;",
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
    text: "SELECT * FROM users WHERE name = ? AND NOT email = ?;",
    values: ["john", "a@b.com"],
  },
  sqlite: {
    text: "SELECT * FROM users WHERE name = ? AND NOT email = ?;",
    values: ["john", "a@b.com"],
  },
  postgres: {
    text: "SELECT * FROM users WHERE name = $1 AND NOT email = $2;",
    values: ["john", "a@b.com"],
  },
});

// --------------------------------------------------------------------------------
// DELETE
// --------------------------------------------------------------------------------

Deno.test("cannot perform `delete` without any constraints", () => {
  assertThrows(
    () => {
      new QueryCompiler({
        type: QueryType.Delete,
        wheres: [],
        columns: [],
        orders: [],
        returning: [],
        tableName: "users",
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
    text: "DELETE FROM users WHERE email = ?;",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "DELETE FROM users WHERE email = ?;",
    values: ["a@b.com"],
  },
  postgres: {
    text: "DELETE FROM users WHERE email = $1;",
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
    text: "INSERT INTO users (email) VALUES (?);",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "INSERT INTO users (email) VALUES (?);",
    values: ["a@b.com"],
  },
  postgres: {
    text: "INSERT INTO users (email) VALUES ($1);",
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
      "INSERT INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?);",
    values: ["a@b.com", 16, 1, "2020-07-06 00:00:00"],
  },
  sqlite: {
    text:
      "INSERT INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?);",
    values: ["a@b.com", 16, 1, "2020-07-06 00:00:00"],
  },
  postgres: {
    text:
      "INSERT INTO users (email, age, is_active, birthday) VALUES ($1, $2, $3, $4);",
    values: ["a@b.com", 16, true, "2020-07-06 00:00:00"],
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
      "INSERT INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?) RETURNING id, name;",
    values: ["a@b.com", 16, 1, "2020-07-06 00:00:00"],
  },
  sqlite: {
    text:
      "INSERT INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?) RETURNING id, name;",
    values: ["a@b.com", 16, 1, "2020-07-06 00:00:00"],
  },
  postgres: {
    text:
      "INSERT INTO users (email, age, is_active, birthday) VALUES ($1, $2, $3, $4) RETURNING id, name;",
    values: ["a@b.com", 16, true, "2020-07-06 00:00:00"],
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
      "INSERT INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?), (?, ?, ?, ?);",
    values: [
      "a@b.com",
      16,
      1,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      0,
      "2020-07-07 00:00:00",
    ],
  },
  sqlite: {
    text:
      "INSERT INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?), (?, ?, ?, ?);",
    values: [
      "a@b.com",
      16,
      1,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      0,
      "2020-07-07 00:00:00",
    ],
  },
  postgres: {
    text:
      "INSERT INTO users (email, age, is_active, birthday) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8);",
    values: [
      "a@b.com",
      16,
      true,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      false,
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
        "INSERT INTO users (email, age) VALUES (?, NULL), (NULL, ?), (?, ?);",
      values: ["b@c.com", 16, "a@b.com", 16],
    },
    sqlite: {
      text:
        "INSERT INTO users (email, age) VALUES (?, NULL), (NULL, ?), (?, ?);",
      values: ["b@c.com", 16, "a@b.com", 16],
    },
    postgres: {
      text:
        "INSERT INTO users (email, age) VALUES ($1, NULL), (NULL, $2), ($3, $4);",
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
    text: "REPLACE INTO users (email) VALUES (?);",
    values: ["a@b.com"],
  },
  sqlite: {
    text: "REPLACE INTO users (email) VALUES (?);",
    values: ["a@b.com"],
  },
  postgres: {
    text: "REPLACE INTO users (email) VALUES ($1);",
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
      "REPLACE INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?);",
    values: ["a@b.com", 16, 1, "2020-07-06 00:00:00"],
  },
  sqlite: {
    text:
      "REPLACE INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?);",
    values: ["a@b.com", 16, 1, "2020-07-06 00:00:00"],
  },
  postgres: {
    text:
      "REPLACE INTO users (email, age, is_active, birthday) VALUES ($1, $2, $3, $4);",
    values: ["a@b.com", 16, true, "2020-07-06 00:00:00"],
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
      "REPLACE INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?) RETURNING id, name;",
    values: ["a@b.com", 16, 1, "2020-07-06 00:00:00"],
  },
  sqlite: {
    text:
      "REPLACE INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?) RETURNING id, name;",
    values: ["a@b.com", 16, 1, "2020-07-06 00:00:00"],
  },
  postgres: {
    text:
      "REPLACE INTO users (email, age, is_active, birthday) VALUES ($1, $2, $3, $4) RETURNING id, name;",
    values: ["a@b.com", 16, true, "2020-07-06 00:00:00"],
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
      "REPLACE INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?), (?, ?, ?, ?);",
    values: [
      "a@b.com",
      16,
      1,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      0,
      "2020-07-07 00:00:00",
    ],
  },
  sqlite: {
    text:
      "REPLACE INTO users (email, age, is_active, birthday) VALUES (?, ?, ?, ?), (?, ?, ?, ?);",
    values: [
      "a@b.com",
      16,
      1,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      0,
      "2020-07-07 00:00:00",
    ],
  },
  postgres: {
    text:
      "REPLACE INTO users (email, age, is_active, birthday) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8);",
    values: [
      "a@b.com",
      16,
      true,
      "2020-07-06 00:00:00",
      "b@c.com",
      17,
      false,
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
        "REPLACE INTO users (email, age) VALUES (?, NULL), (NULL, ?), (?, ?);",
      values: ["b@c.com", 16, "a@b.com", 16],
    },
    sqlite: {
      text:
        "REPLACE INTO users (email, age) VALUES (?, NULL), (NULL, ?), (?, ?);",
      values: ["b@c.com", 16, "a@b.com", 16],
    },
    postgres: {
      text:
        "REPLACE INTO users (email, age) VALUES ($1, NULL), (NULL, $2), ($3, $4);",
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
      "UPDATE users SET email = ?, age = ?, is_active = ?, birthday = ? WHERE email = ?;",
    values: ["b@c.com", 16, 1, "2020-07-06 00:00:00", "a@b.com"],
  },
  sqlite: {
    text:
      "UPDATE users SET email = ?, age = ?, is_active = ?, birthday = ? WHERE email = ?;",
    values: ["b@c.com", 16, 1, "2020-07-06 00:00:00", "a@b.com"],
  },
  postgres: {
    text:
      "UPDATE users SET email = $1, age = $2, is_active = $3, birthday = $4 WHERE email = $5;",
    values: ["b@c.com", 16, true, "2020-07-06 00:00:00", "a@b.com"],
  },
});
