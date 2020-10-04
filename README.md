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

## Getting Started

Here's an example of a Deno project that uses Cotton.

```ts
import { connect } from "https://deno.land/x/cotton@v0.7.2/mod.ts";

const db = await connect({
  type: "sqlite",
  database: "db.sqlite3",
});
```

To use Cotton in your project, you can import `cotton` package from [deno.land/x](https://deno.land/x) in your file. We highly recommend you to use semantic versioning by explicitly tell Deno which version you want to use in the import URL.

Typically, the first thing you want to do is to create a connection to a database. Here, we're using `connect` and pass our database configuration. You can read more about connection [here](connection.md).

Once our database is connected, do anything with it such as performing an SQL query.

```ts
const users = await db.query("SELECT * FROM users");

for (const user of users) {
  console.log(user); // { email: 'a@b.com', age: 16, ... }
}
```

You can learn more about Cotton through these links. Have fun! 😃

- [Creating a connection](docs/guide/connection.md)
- [Query builder](docs/guide/query-builder.md)
- [Object-relational mapper](docs/guide/model.md)
- [Database migrations](docs/guide/migrations.md)
