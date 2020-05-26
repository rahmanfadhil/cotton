# Cotton

![ci](https://github.com/rahmanfadhil/cotton/workflows/ci/badge.svg?branch=master)

SQL Database Toolkit for Deno.

## Features

- Database Adapters
  - ✅ SQLite3 _(via [sqlite](https://github.com/dyedgreen/deno-sqlite))_
  - ✅ MySQL _(via [deno_mysql](https://manyuanrong/deno_mysql))_
  - 🚧 MariaDB _(wait for [deno_mysql](https://github.com/manyuanrong/deno_mysql) to support it)_
  - ✅ PostgresQL _(via [postgres](https://github.com/deno-postgres/deno-postgres))_
- 🚧 Query Builder
- 🚧 Object-Relational Mapper
  - 🚧 Model Manager
  - ❌ Relationship
  - ❌ Data Validators
  - ❌ Model Factory
  - ❌ Hooks
- ❌ Migrations
- ❌ Data Seeder
- ❌ Model Factory
- ❌ Caching

## Connect to database

Currently, Cotton supports SQLite3, MySQL, and PostgreSQL. To create a connection, use `connect` and pass the connection configurations.

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
await db.execute(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255),
  );
`);
```

Cotton provides an easy-to-use query builder which allows you to perform queries without writing raw SQL.

```ts
// Execute "SELECT * FROM users;"
const users = await db.queryBuilder("users").execute();

for (const user in users) {
  console.log(user.email);
}
```

However, you can still use raw SQL via `query` method.

```ts
const users = await db.query("SELECT * FROM users;");

for (const user in users) {
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
import { Model } from "https://deno.land/x/cotton/mod.ts";

class User extends Model {
  static tableName = "users";
  static primaryKey = "id"; // optional

  email: string;
  // Other fields here...
}
```

To do CRUD operations to our model, we can use the database manager provided by connection. Here are some basic examples:

```ts
const user = await db.manager.findOne(User, 1); // find user by id
console.log(user instanceof User); // true
```

```ts
const users = await db.manager.find(User); // find all users

for (const user in users) {
  console.log(user.email);
}
```

## Query Builder

### Basic query

```ts
await db
  .queryBuilder("users")
  .where("email", "a@b.com")
  .where("name", "john")
  .execute();
// SELECT * FROM users WHERE email = 'a@b.com' AND name = 'john';
```

### Select columns

```ts
await db.queryBuilder("users").select("email").execute();
// SELECT (email) FROM users;

await db.queryBuilder("users").select("id", "email").execute();
// SELECT (id, email) FROM users;

await db.queryBuilder("users").select("id").select("email").execute();
// SELECT (id, email) FROM users;
```

### Pagination

```ts
await db.queryBuilder("users").limit(5).offset(5).execute(); // Skip 5 row and take 5
// SELECT * FROM users LIMIT 5 OFFSET 5;
```
