# Getting Started

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
