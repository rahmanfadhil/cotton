# 连接

当前，Cotton 暂时仅支持 [SQLite3](https://sqlite.org), [MySQL](https://mysql.com), 和 [PostgreSQL](https://postgresql.org)。
Cotton 提供了一个让你可以创建所有受支持的数据库的 `connect` 函数。

```ts
const db = await connect({
  type: "sqlite",
  database: "./db.sqlite3",
});
```

`type`字段是必须的。它决定了你要连接的数据库的类型。接着，你可以传递其他配置字段，诸如  `database`、`port`、`hostname`、`username`、 和 `password`。

## 连接到 SQLite

连接到 SQLite 唯一要关心的是 `database`字段，它指向数据库文件的路径。

```ts
const db = await connect({
  type: "sqlite",
  database: "./db.sqlite3",
});
```

或者，你可以制定为 `:memory:`， 这样你的数据将会被存储在内存中。

```ts
const db = await connect({
  type: "sqlite",
  database: ":memory:",
});
```

## MySQL 和 PostgreSQL

连接到 MySQL 和 PostgreSQL 非常简单。

**MySQL 示例:**

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

**PostgreSQL 示例:**

```ts
const db = await connect({
  type: "postgres",
  port: 5432,
  database: "mydb",
  hostname: "localhost",
  username: "root",
  password: "12345",
});
```

通常 MySQL 和 PostgreSQL 数据库要求输入用户名和密码。但是，如果没有密码，你可以让密码为空。

## 断开连接

使用完数据库后，断开连接。这样可以为你腾出更多的空间。

```ts
await db.disconnect();
```
