# Schema

Schema is a query interface which allows you to do anything with your database schema. You often see this in your migrations code, however, you can still use it anywhere in your app as long as you connected to the database. Heavily inspired by [Laravel](https://laravel.com).

Let's take a look at this example.

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

This is an example of a [migration file](migrations.md#creating-a-migration). Here, we're trying to create a basic table called `user`. This table contains two column, an auto incremental primary key called `id` and classic varchar column called `title`.

On the `down` function, where

With `Schema`, you can do the following things:

- Create a table or schema
- Alter tables and columns
- Drop tables and columns
- Manage constraints and indexes

## Create a table

You can use `createTable` method to create a new table. This two parameters, the first one is the table name and the second is a callback function. This callback function gets a `TableBuilder` from the parameter, which contains series of method that helps you to add columns to your table.

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

You can see all available columns [here](#column-types).

## Drop a table

You can easily drop a table by calling `dropTable` and pass the table name.

```ts
await schema.dropTable("users");
```

To drop multiple tables, use `dropTables` and pass an array as the parameter.

```ts
await schema.dropTables(["users"]);
```

## Rename a table

Use `renameTable` to rename an existing table.

```ts
await schema.renameTable("users", "accounts");
```

## Check if a table exists

Use `hasTable` check if a table is exists in the database.

```ts
if (await schema.hasTable("users")) {
  // `users` table exists
}
```

## Add column

Adding a new column to a table can be done by using the `addColumn` method.

```ts
await schema.addColumn("users", "", "", 255);
```

Optionally, you can pass a length for a varchar column.

```ts
await schema.addColumn("users", "name", "varchar", 255);
```

## Check if a table has a column

To check if a table has a column in it, you can use `hasColumn` and pass the table name and the expected column.

```ts
if (await schema.hasTable("users", "name")) {
  // `users` table containts `name` column
}
```

## Column types

These are the available column types you can use to build your tables.

| Syntax                          | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `schema.id()`                   | Shortcut for `bigIncrements('id')`.                                                  |
| `schema.increments('id')`       | Auto incremental column (`SERIAL` in PostgreSQL).                                    |
| `schema.bigIncrements('id')`    | Big auto incremental column.                                                         |
| `schema.smallIncrements('id')`  | Small auto incremental column.                                                       |
| `schema.varchar('name', 100)`   | VARCHAR (text) column with a length (default `255`).                                 |
| `schema.text('content')`        | A large TEXT column (`LONGTEXT` in MySQL).                                           |
| `schema.boolean('is_active')`   | A boolean compatible column. Tiny int in MySQL & SQLite and `BOOLEAN` in PostgreSQL. |
| `schema.integer('votes')`       | Basic INTEGER (number) column.                                                       |
| `schema.bigInteger('price')`    | BIGINT equivalent column.                                                            |
| `schema.smallInteger('votes')`  | SMALLINT equivalent column.                                                          |
| `schema.datetime('created_at')` | Date and time column (`TIMESTAMP` in PostgreSQL).                                    |
| `schema.date('created_at')`     | DATE equvalient column.                                                              |
| `schema.timestamps()`           | Creates two `datetime` columns called `created_at` and `updated_at`.                 |
| `schema.custom('age INTEGER')`  | Add column by yoursel using SQL query.                                               |
| `schema.foreignId('user_id')`   | Add a foreign key to other table's primary key.                                      |
