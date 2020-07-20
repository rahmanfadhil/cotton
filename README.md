# Cotton

![ci](https://github.com/rahmanfadhil/cotton/workflows/ci/badge.svg?branch=master) ![GitHub release (latest by date)](https://img.shields.io/github/v/release/rahmanfadhil/cotton)

**SQL Database Toolkit for Deno.**

- Well-tested
- Type-safe
- Supports **MySQL**, **SQLite**, and **PostgreSQL**
- Semantic versioning

## Documentation

- [Getting started guide](https://rahmanfadhil.github.io/cotton)
- [Explore the API](https://doc.deno.land/https/deno.land/x/cotton/mod.ts)

## How to use

Currently, Cotton supports [SQLite3](https://sqlite.org), [MySQL](https://mysql.com), and [PostgreSQL](https://postgresql.org). To create a connection, use `connect` and pass the connection configurations.

```ts
import { connect } from "https://deno.land/x/cotton/mod.ts";

const db = await connect({
  type: "sqlite", // available type: 'mysql', 'postgres', and 'sqlite'
  database: "db.sqlite",
  // other...
});
```

You can run an SQL statement using the `execute` method.

```ts
await db.query(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255),
  );
`);
```

Cotton provides an easy-to-use query builder which allows you to perform queries without writing raw SQL.

```ts
// Execute "SELECT * FROM users;"
const users = await db.table("users").execute();

for (const user in users) {
  console.log(user.email);
}
```

However, you can still use raw SQL via `query` method.

```ts
const users = await db.query("SELECT * FROM users;");

for (const user of users) {
  console.log(user.email);
}
```

Once, you've finished using the database, disconnect it.

```ts
await db.disconnect();
```

## Model

A model is nothing more than a class that extends `Model`.

```ts
import { Model, Column } from "https://deno.land/x/cotton/mod.ts";

@Model("users")
class User {
  @Column()
  email!: string;

  @Column()
  age!: number;

  @Column()
  created_at!: Date;
}
```

Keep in mind that you need to override the default TypeScript configration in order to use this decorator feature.

```json
// tsconfig.json

{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

To run your app, you need to explicitly tell Deno that you have a custom TypeScript configuration by passing the `--config` argument.

```
$ deno run --config tsconfig.json main.ts
```

To do CRUD operations to our model, we can use the provided method in our model:

```ts
const user = await User.findOne(1); // find user by id
console.log(user instanceof User); // true
```

```ts
const users = await User.find(); // find all users

for (const user in users) {
  console.log(user.email);
}
```

To save the current model to the database, use the `save` method.

```ts
const user = new User();
user.email = "a@b.com";
user.age = 16;
user.created_at = new Date("1 June, 2020");
await user.save();
```

You also can use the `insert` method to create the model instance and save it to the database at the same time.

```ts
const user = await User.insert({
  email: "a@b.com",
  age: 16,
  created_at: new Date("1 June, 2020"),
});
```

To insert multiple records, you can simply pass an array as the parameter.

```ts
const user = await User.insert([
  { email: "a@b.com", age: 16, created_at: new Date("1 June, 2020") },
  { email: "b@c.com", age: 17, created_at: new Date("2 June, 2020") },
]);
```

## Query Builder

Cotton offers a simple, powerful, and database agnostic query builder. It allows you to construct SQL queries with ease. The values are replaced with a placeholder in the query string and being handled by the database to prevent SQL injection.

### Basic query

```ts
await db
  .table("users")
  .where("email", "a@b.com")
  .where("name", "john")
  .execute();
// query  : SELECT * FROM `users` WHERE `email` = ? AND `name` = ?;
// params : ['a@b.com', 'john']
```

Once you connected to the database, you can access the query builder via `table` method. The `table` method requires you to pass your table name which you want to fetch. You can chain all the methods you need in order to add more constraints or statements to your query.

### or and not

```ts
await db.table("users").not("name", "kevin").execute();
// query  : SELECT * FROM `users` WHERE NOT `name` = ?;
// params : ['kevin']

await db.table("users").where("name", "kevin").or("name", "john").execute();
// query  : SELECT * FROM `users` WHERE `name` = ? OR `name` = ?;
// params : ['kevin', 'john']
```

### Select columns

```ts
await db.table("users").select("email").execute();
// SELECT (`email`) FROM `users`;

await db.table("users").select("id", "email").execute();
// SELECT (`id`, `email`) FROM `users`;

await db.table("users").select("id").select("email").execute();
// SELECT (`id`, `email`) FROM `users`;
```

### Pagination

```ts
await db.table("users").limit(5).offset(10).execute(); // Skip 10 rows and take 5
// query  : SELECT * FROM `users` LIMIT ? OFFSET ?;
// params : [5, 10]
```

### Insert data

```ts
await db
  .table("users")
  .insert({
    email: "a@b.com",
    age: 16,
    created_at: new Date("5 June, 2020"),
  })
  .execute();

// Insert multiple
await db
  .table("users")
  .insert([{ email: "a@b.com" }, { email: "b@c.com" }])
  .execute();
```

### Replace data

```ts
await db
  .table("users")
  .replace({
    email: "a@b.com",
    age: 16,
    created_at: new Date("5 June, 2020"),
  })
  .execute();
```

### Delete data

```ts
await db.table("users").where("email", "a@b.com").delete().execute();
```

### Update data

```ts
await db
  .table("users")
  .where("email", "a@b.com")
  .update({ name: "John" })
  .execute();
```
