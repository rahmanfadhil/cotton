# Contribute to Cotton

In this early stage, our focus is to implement the basic features of the query builder (`src/querybuilder.ts`). Here are some features that are not implemented yet:

- Select columns (`*` by default)
- Offset
- Order by
- Left join
- Inner join
- Input sanitization (Prevent SQL injection)
- Connect via URL

## Testing

We need a more tests!

- [querybuilder_test.ts](./src/querybuilder_test.ts)
- [connect_test.ts](./src/connect_test.ts)
- [adapter/mysql_test.ts](./src/adapter/mysql_test.ts)
- [adapter/sqlite_test.ts](./src/adapter/sqlite_test.ts)
- [adapter/postgres_test.ts](./src/adapter/postgres_test.ts)

To run tests, you need to add `.env.test` file on the project root folder (don't commit!).

```
TEST_SQLITE_DATABASE=db.sqlite

TEST_POSTGRES_DATABASE=test
TEST_POSTGRES_HOSTNAME=localhost
TEST_POSTGRES_USERNAME=
TEST_POSTGRES_PASSWORD=

TEST_MYSQL_DATABASE=test
TEST_MYSQL_HOSTNAME=127.0.0.1
TEST_MYSQL_USERNAME=
TEST_POSTGRES_PASSWORD=
```

The password fields are optional. If you don't set any password to your database, you don't need to define it.
