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

## Database Adapter

Currently, Cotton supports three popular databases which includes SQLite3, MysQL / MariaDB, and PostgresQL.

### Creating adapter

```ts
import { SqliteAdapter } from "https://deno.land/x/cotton/src/sqlite/adapter.ts";
// import { PostgresAdapter } from "https://deno.land/x/cotton/src/postgres/adapter.ts";
// import { MysqlAdapter } from "https://deno.land/x/cotton/src/mysql/adapter.ts";

const adapter = new SqliteAdapter({ database: "./test.db" });
```

### Making queries

```ts
interface User {
  email: string;
  name: string;
}

const users = await adapter.query<User>("SELECT email, name FROM users;");

for (user in users) {
  console.log(`Hello ${user.name}`);
}
```

### Execute SQL statement

```ts
// Bind values to prevent SQL injection
await adapter.execute("INSERT INTO users (email, name) VALUES (?, ?);", [
  "a@b.com",
  "john doe",
]);
```

## Query Builder

### Select all

```ts
import { QueryBuilder } from "https://deno.land/x/cotton/mod.ts";

const queryBuilder = new QueryBuilder("users");
const query = queryBuilder.where("email = ?", "a@b.com").first().getSQL();
// SELECT * FROM users WHERE email = 'a@b.com';
```

### Limit result

```ts
import { QueryBuilder } from "https://deno.land/x/cotton/mod.ts";
const queryBuilder = new QueryBuilder("users");
const query = queryBuilder.where("email = ?", "a@b.com").limit(5).getSQL();
// SELECT * FROM users WHERE email = 'a@b.com';
```

### Multiple where clause

```ts
import { QueryBuilder } from "https://deno.land/x/cotton/mod.ts";
const queryBuilder = new QueryBuilder("users");
const query = queryBuilder
  .where("email = ?", "a@b.com")
  .where("name = ?", "john")
  .getSQL();
// SELECT * FROM users WHERE email = 'a@b.com' AND name = 'john';
```
