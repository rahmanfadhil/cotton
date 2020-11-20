# 模式

模式是一个查询接口，允许您对数据库模式执行任何操作。您通常会在迁移代码中看到这一点，然而，只要连接到数据库，受[Laravel](https://laravel.com)的启发, 您仍然可以在应用程序中的任何位置使用它。

让我们来看一下如下示例。

```ts
import { Schema } from "https://deno.land/x/cotton/mod.ts";

export async function up(schema: Schema) {
  await schema.createTable("users", (table) => {
    table.id();
    table.varchar("name");
  });
}

export async function down(schema: Schema) {
  await schema.dropTable("users");
}
```

这是一个关于 [migration file](migrations.md#creating-a-migration) 的示例。在这，我们尝试创建一个名字为 `user` 的表。
这个表包含两列，一个为主键自增长的键 `id`，另一个为 传统 varchar 类型的列 `title`。

使用 `Schema`， 你可以做如下事情：

- 创建表或者模式
- 修改表或者列
- 删除表或者列
- 管理约束和索引

## 创建表

您可以使用 `createTable` 方法创建一个新表。 这有两个参数，第一个是表名，第二个是回调函数。 这个回调函数从参数中获取一个 `TableBuilder`，它包含一系列可帮助您向表中添加列的方法。

```ts
await schema.createTable("users", (table) => {
  table.id();
  table.varchar("email");
  table.integer("age");
  table.boolean("is_active");
  table.custom("fullname VARCHAR(255)");
  table.timestamps();
});
```

你可以在[这](#column-types)查看所有可用的列。

## 删除表

你可以通过调用 `dropTable` 并传入表名来轻松删除表。

```ts
await schema.dropTable("users");
```

为了同时删除多张表，请使用 `dropTables` 并以数组的形式传入表名。

```ts
await schema.dropTables(["users"]);
```

## 重命名表名

使用 `renameTable` 来重命名已存在的表。

```ts
await schema.renameTable("users", "accounts");
```

## 检查表是否已存在

使用 `hasTable` 来检查表是否在数据库中已存在。

```ts
if (await schema.hasTable("users")) {
  // `users` table exists
}
```

## 添加列

可以使用 `addColumn` 方法来为表添加列。

```ts
const nameColumn = new ColumnBuilder("name", "varchar", 255)
  .notNull()
  .default("John");
await schema.addColumn("users", nameColumn);
```

## 检查表是否有特定的列

为了检查表是否有特定的列， 你可以使用 `hasColumn` 并传入你期望的列名来检查。

```ts
if (await schema.hasTable("users", "name")) {
  // `users` table containts `name` column
}
```

## 列类型

如下是你用来构建你的表可以用到的所有列的类型。

| 语法                          | 描述                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `id()`                          | `bigIncrements('id')` 的缩写。                                                  |
| `increments('id')`              | 自增长的列（在 PostgreSQL 中是 `SERIAL`）。                                    |
| `bigIncrements('id')`           | 大自动增量列。                                                         |
| `smallIncrements('id')`         | 小自动增量列。                                                       |
| `varchar('name', 100)`          | 带有长度的 VARCHAR (text) (默认 `255`).                                 |
| `text('content')`               | 大文本列 (在 MySQL 是 `LONGTEXT`).                                           |
| `boolean('is_active')`          | 布尔兼容列。 MySQL＆SQLite中的Tiny int以及PostgreSQL中的BOOLEAN。 |
| `integer('votes')`              | 基本 INTEGER（number）列。                                                       |
| `bigInteger('price')`           | BIGINT等效列。                                                            |
| `smallInteger('votes')`         | SMALLINT 等效列。                                                          |
| `datetime('created_at')`        | 日期和时间列 (在 PostgreSQL 中是 `TIMESTAMP`).                                    |
| `date('created_at')`            | 日期等效列。                                                              |
| `timestamps()`                  | 创建两个名为“ created_at”和“ updated_at”的“ datetime”列。                 |
| `custom('age INTEGER')`         | 使用SQL查询自己添加列。                                               |
| `foreignId('user_id', 'users')` | 将外键添加到其他表的主键。                                      |
