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

- [src/connect_test.ts](./src/connect_test.ts)
- [src/querybuilder_test.ts](./src/querybuilder_test.ts)
- [src/adapters/sqlite_test.ts](./src/adapters/sqlite_test.ts)
- [src/adapters/postgres_test.ts](./src/adapters/postgres_test.ts)
- [src/adapters/mysql_test.ts](./src/adapters/mysql_test.ts)
- [src/utils/date_test.ts](./src/utils/date_test.ts)
- [src/model_test.ts](./src/model_test.ts)
- [src/adapters/adapter_test.ts](./src/adapters/adapter_test.ts)

Before you get started, you need to have Docker and Docker Compose installed.

To run the tests, execute the following command.

```sh
./test.sh

# Or

docker-compose up --build --exit-code-from tests
```

To clean up everything, run:

```sh
docker-compose down --volumes
```
