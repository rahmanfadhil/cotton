# Connection

Currently, Cotton supports [SQLite3](https://sqlite.org), [MySQL](https://mysql.com), and [PostgreSQL](https://postgresql.org). Cotton provides a `connect` function which allows you to create a new connection to any supported database.

```ts
const db = await connect({
  type: "sqlite",
  database: "./db.sqlite3",
});
```

The `type` option is required, which determine what type of database you're trying to connect. Then, you can pass the other configurations such as `database`, `port`, `hostname`, `username`, and `password`.

## Connecting to SQLite

The only configuration that the SQLite adapter care is the `database`, which is a path to your database file.

```ts
const db = await connect({
  type: "sqlite",
  database: "./db.sqlite3",
});
```

Or, you can pass `:memory:` if you just want to store it in memory.

```ts
const db = await connect({
  type: "sqlite",
  database: ":memory:",
});
```

## MySQL and PostgreSQL

Connecting to MySQL and PostgreSQL is pretty straight forward.

**MySQL example:**

```ts
const db = await connect({
  type: "mysql",
  port: 5432,
  database: "mydb",
  hostname: "localhost",
  username: "root",
  password: "12345",
});
```

**PostgreSQL example:**

```ts
const db = await connect({
  type: "mysql",
  port: 5432,
  database: "mydb",
  hostname: "localhost",
  username: "root",
  password: "12345",
});
```

Typically MySQL and PostgreSQL datababase ask for a username and password. However, if there is no password, you can leave it empty.
