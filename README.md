# cotton

SQL Database Toolkit for Deno.

## Features

- Database Adapter
  - ✅ SQLite3
  - 🚧 MySQL & MariaDB
  - ❌ PostgresQL
- 🚧 Query Builder
- ❌ Migrations
- ❌ Object-Relational Mapper

## Database Adapter

### Creating adapter

```ts
import { SqliteAdapter } from "https://deno.land/x/cotton/sqliteadapter.ts";

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
await adapter.execute(
  "INSERT INTO users (email, name) VALUES ('a@b.com', 'john doe');"
);
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
