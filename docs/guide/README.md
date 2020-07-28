# Getting Started

Here's an example of a Deno project that uses Cotton.

```ts
import { connect } from "https://deno.land/x/cotton@v0.6.2/mod.ts";

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

- [Creating a connection](connection)
- [Query builder](query-builder.md)
- [Object-relational mapper](model.md)
- [Database migrations](migrations.md)
