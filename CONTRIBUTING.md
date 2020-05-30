# Contribute to Cotton

In this early stage, our focus is to implement the basic features of the query builder (`src/querybuilder.ts`). Here are some features that are not implemented yet:

- Select columns (`*` by default)
- Offset
- Order by
- Left join
- Inner join
- Input sanitization (Prevent SQL injection)
- Connect via URL

## Roadmap

- Database Adapters
  - ✅ SQLite3 _(via [sqlite](https://github.com/dyedgreen/deno-sqlite))_
  - ✅ MySQL _(via [deno_mysql](https://manyuanrong/deno_mysql))_
  - 🚧 MariaDB _(wait for [deno_mysql](https://github.com/manyuanrong/deno_mysql) to support it)_
  - ✅ PostgresQL _(via [postgres](https://github.com/deno-postgres/deno-postgres))_
- 🚧 Query Builder
- 🚧 Object-Relational Mapper
  - 🚧 Model Manager
  - ❌ Relationship
  - ❌ Data Validators
  - ❌ Hooks
- ❌ Migrations

## Testing

We need a more tests!

- [querybuilder_test.ts](./src/querybuilder_test.ts)
- [connect_test.ts](./src/connect_test.ts)
- [adapter/mysql_test.ts](./src/adapter/mysql_test.ts)
- [adapter/sqlite_test.ts](./src/adapter/sqlite_test.ts)
- [adapter/postgres_test.ts](./src/adapter/postgres_test.ts)

Before you get started, you need to add `.env` file on the project root folder (don't commit!).

```
SQLITE_DATABASE=db.sqlite3

POSTGRES_DATABASE=test
POSTGRES_HOSTNAME=localhost
POSTGRES_USERNAME=
POSTGRES_PASSWORD=

MYSQL_DATABASE=test
MYSQL_HOSTNAME=127.0.0.1
MYSQL_USERNAME=
MYSQL_PASSWORD=
```

The password fields are optional. If you don't set any password to your database, you don't need to define it.

To run the tests, execute the following command.

```
$ deno test --allow-net --allow-read --allow-write --allow-env -c tsconfig.json test.ts # long version (but safer)
$ deno test -A -c tsconfig.json test.ts # short version
```
