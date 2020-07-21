# Query Builder

Cotton provides a powerful SQL query builder which you can use to construct and execute SQL queries in a type-safe way.

Once you have established a connection, you can now use the query builder via `table` method.

```ts
const db = connect({
  type: "sqlite",
  // other options...
});

const users = await db.table("users").execute(); // SELECT * FROM `users`;

for (const user of users) {
  console.log(user); // { id: 1, email: 'a@b.com', ... }
}
```

The `table` methods takes only one argument, which is the name of the table you want to fetch. This method returns a `QueryBuilder` instance, which contains more methods to add more constraints and perform other things.

```ts
// SELECT * FROM `users` WHERE `id` = 1;
const users = db.table("users").where("id", 1).execute();
```

If you just want to get the SQL query string and don't want run the it, you can end the statement with `toSQL` instead of `execute`.

```ts
const sql = db.table("users").where("id", 1).toSQL();
console.log(sql); // "SELECT * FROM `users` WHERE `id` = 1;"
```
