# Contribute to Cotton

There are still a lot of room for improvements. Here are some features that are not available yet:

[Query Buider](./src/querybuilder.ts)

- Left Join
- Inner Join
- Input Sanitization.

[Adapter](./src/adapters)

- Connect via URL

[Migrations](./src/migrations)

- Add index in [TableBuilder](./src/migrations/tablebuilder.ts)
- [TableUpdater](./src/migrations/tableupdater.ts) (for altering a table)
- Seeder
- Factory

## Roadmap

- Database Adapters
  - ✅ SQLite3 _(via [sqlite](https://github.com/dyedgreen/deno-sqlite))_
  - ✅ MySQL _(via [deno_mysql](https://manyuanrong/deno_mysql))_
  - 🚧 MariaDB _(wait for [deno_mysql](https://github.com/manyuanrong/deno_mysql) to support it)_
  - ✅ PostgresQL _(via [postgres](https://github.com/deno-postgres/deno-postgres))_
- 🚧 Query Builder
- 🚧 Object-Relational Mapper
  - ✅ Model Manager
  - ❌ Relationship
  - ❌ Data Validators
  - ❌ Hooks
- 🚧 Migrations

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
