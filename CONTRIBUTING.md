# Contribute to Cotton

There are still a lot of room for improvements. Here are some features that are not available yet:

[Query Buider](./src/querybuilder.ts)

Here are some query expressions that haven't implemented yet.

- MIN, MAX, SUM, AVG
- RAW SQL
- INCREMENT & DECREMENT

We also want to add some features like:

- Add custom SQL query string.
- Nested queries (combining AND & OR hierarchically).

[Adapter](./src/adapters)

- Connect via URL

[Migrations](./src/migrations)

- Add index in [TableBuilder](./src/migrations/tablebuilder.ts)
- Drop table column for SQLite in [TableBuilder](./src/migrations/tablebuilder.ts)
- Seeder
- Factory

[Manager](./src/manager.ts)

- Hooks
- JSON field
- Array field

## Roadmap to v1.0

- Database Adapters
  - ✅ SQLite3 _(via [sqlite](https://github.com/dyedgreen/deno-sqlite))_
  - ✅ MySQL _(via [deno_mysql](https://manyuanrong/deno_mysql))_
  - 🚧 MariaDB _(wait for [deno_mysql](https://github.com/manyuanrong/deno_mysql) to fully support it)_
  - ✅ PostgresQL _(via [postgres](https://github.com/deno-postgres/deno-postgres))_
- 🚧 Query Builder
- ✅ Object-Relational Mapper
  - ✅ Model Manager
  - ✅ Base Model
  - ✅ Model query
  - ✅ Bulk insert
  - ✅ Bulk remove
  - 🚧 Relationships (only one-to-many)
  - ❌ Hooks
- ✅ Command-line tool
  - ✅ Migrations
  - 🚧 Seeder
- 🚧 Model serializer (only in `serializer` branch)
  - ✅ Serializing "dumping"
  - ✅ Deserializing "loading"
  - ❌ Validating
  - ❌ Sanitizing

## Testing

Please make sure that you are implementing tests for the features that you're working on.

To run the tests, you need to have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

Then, execute the following command.

```sh
./test.sh
```

This will fire up Docker Compose and initialize 3 services. MySQL and Postgres database, and the test container itself that runs all the test code.

To clean up everything, run:

```sh
docker-compose down --volumes
```

## Writing tests

There are two types of tests that we should care about, unit test and integration test. You don't have to use both of them all the time because it really depends on the feature that you're working on. If you're working on a utility function that doesn't have to access the database, unit test is the way to go. If the feature is accesing the database through high-level abstraction such as [Model Manager](https://rahmanfadhil.github.io/cotton) and [Query Builder](https://rahmanfadhil.github.io/cotton/guide/query-builder), you can still use unit test and them using `mock` library which served from the `testdeps.ts` file.

To make a unit test, you can simply use the `Deno.test` function.

```ts
Deno.test("Manager.save() -> should save a model", () => {
  // ...
});
```

However, there are some features that need to test end-to-end, such as [model manager](./src/manager.ts) and [migrations](./src/migrations/schema.ts). That's why we've written a utility function to make an integration test called `testDB`. It works exactly like `Deno.test` but you'll get an `Adapter` instance within the parameter and it'll create three tests for PostgreSQL, MySQL, and SQLite.

```ts
Deno.test("Manager.save() -> should save a model", (client) => {
  // ...
});
```
