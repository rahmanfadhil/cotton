# Cotton

SQL Database Toolkit for Deno.

## Features

- Database Adapter
  - ✅ SQLite3
  - ✅ MySQL & MariaDB
  - 🚧 PostgresQL
- 🚧 Query Builder
- ❌ Migrations
- ❌ Object-Relational Mapper

## Connect to database

Currently, Cotton supports SQLite3, MySQL, and PostgreSQL. To create a connection, use `cotton` and pass the connection configurations.

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

Once, you've finished using the database, disconnect to prevent memory leaks.

```ts
await db.disconnect();
```

## Query bulder

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
