# Contribute to Jungle ORM

In this early stage, our focus is to implement the basic features of the query builder (`src/querybuilder.ts`). Here are some features that are not implemented yet:

- Select columns (`*` by default)
- Offset
- Order by
- Left join
- Inner join
- Input sanitization (Prevent SQL injection)
- Connect via URL

## Running tests

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
