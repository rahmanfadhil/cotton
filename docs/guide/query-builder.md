# Query Builder

Cotton offers a simple, powerful, and database agnostic query builder. It allows you to construct SQL queries with ease.

Once you have established a connection, you can now use the query builder via `table` method.

```ts
const db = connect({
  type: "sqlite",
  // other options...
});

const users = await db.table("users").execute(); // SELECT * FROM `users`;

for (const user of users) {
  console.log(user); // { id: 1, email: 'a@b.com', ... }
}
```

The `table` methods takes only one argument, which is the name of the table you want to fetch. This method returns a `QueryBuilder` instance, which contains more methods to construct your query. You can chain all these methods you need in order to add more constraints or statements.

```ts
// SELECT * FROM `users` WHERE `id` = ?;
const users = db.table("users").where("id", 1).execute();
```

As you can see, the values are replaced with a placeholder in the query string and being handled by the database to prevent SQL injection.

If you just want to get the SQL query string and don't want run the it, you can end the statement with `toSQL` instead of `execute`.

```ts
const { text, values } = db.table("users").where("id", 1).toSQL();
console.log(text); // "SELECT * FROM `users` WHERE `id` = ?;"
console.log(values); // [1]
```

## Where clauses

One of the most common thing people do in SQL query is using `WHERE` clause to filter the result.

Filtering records through `WHERE` clause is one of the most common thing people do with SQL query. In Cotton, you can easily add where clause of any kind by simply using `where` method.

```ts
db.table("users").where("id", 1);
```

The first parameter is the column name, and the second is the expected value. By default, it will use the `=` operator which will check whether the value is equal. You can customize the query operator by using `Q` helper to customize the SQL expressions.

```ts
db.table("users").where("id", Q.gt(1)); // SELECT * FROM `users` WHERE `id` > 1;
db.table("users").where("id", Q.in([1, 2, 3])); // SELECT * FROM `users` WHERE `id` IN (1, 2, 3);
db.table("users").where("id", Q.between([1, 5])); // SELECT * FROM `users` WHERE `id` BETWEEN 1 AND 5
```

These are the valid expressions you can access through `Q` utility.

| Syntax                 | SQL Equivalent | Description                               |
| ---------------------- | -------------- | ----------------------------------------- |
| `Q.in([1, 2, 3])`      | `IN`           | The value is one of the given values      |
| `Q.notIn([1, 2, 3])`   | `NOT IN`       | The value is not one of the given values  |
| `Q.between(5, 10)`     | `BETWEEN`      | The value (number) is between two numbers |
| `Q.notBetween(5, 10)`  | `NOT BETWEEN`  | The value (number) is between two numbers |
| `Q.like('%john%')`     | `LIKE`         | LIKE operator                             |
| `Q.notLike('%john%')`  | `NOT LIKE`     | NOT LIKE operator                         |
| `Q.ilike('%john%')`    | `ILIKE`        | ILIKE (case-insensitive) operator         |
| `Q.notIlike('%john%')` | `NOT ILIKE`    | NOT ILIKE (case-insensitive) operator     |
| `Q.eq('a@b.com')`      | `=`            | Is equal to                               |
| `Q.neq('a@b.com')`     | `!=`           | Is not equal to                           |
| `Q.gt(7)`              | `>`            | Greater than                              |
| `Q.gte(7)`             | `>=`           | Greater than equal                        |
| `Q.lt(7)`              | `<`            | Lower than                                |
| `Q.lte(7)`             | `<=`           | Lower than equal                          |
| `Q.null()`             | `IS NULL`      | Is the value null                         |
| `Q.notNull()`          | `IS NOT NULL`  | Is the value not null                     |

Currently, the valid values are `boolean`, `string`, `null`, `number`, and `Date`.

```ts
query
  .table("users")
  .where("email", "a@b.com")
  .where("age", Q.gte(16))
  .where("is_active", true)
  .where("birthday", Q.lt(new Date("7 July, 2020")));
```

Sometimes you want to exclude or some records that match given conditions. For that, you can use `not`.

```ts
query.table("users").not("is_active", true);
```

Or, if you want to find records if one of the conditions are true, use `or`.

```ts
query.table("users").where("name", "John").or("name", "Jane");
```

## Selecting columns

By default, query builder will select every single columns in the table with `*`. However, you can choose which columsnt to select in a query by calling `select`.

```ts
db.table("users").select("email");
```

To select multiple columns, you can either pass multiple strings to the parameter or chain it multiple times.

```ts
db.table("users").select("email", "age", "is_active");

// Alternatively...
db.table("users").select("email").select("age").select("is_active");
```

If you want to select only unique values, you can enable distinct select by using `distinct` method.

```ts
db.table("users").select("email").distinct();
```

## Sorting

You can sort a column using `order`.

```ts
db.table("users").order("age");
```

By default this will sort in ascending order. You can change this by passing the second parameter.

```ts
db.table("users").order("age", "DESC"); // or ASC
```

To sort multiple column, you can chain this method as many as you want.

```ts
db.table("users").order("age", "DESC").order("created_at");
```

## Count

You can count how many records that match given conditions by using the `count` method.

```ts
db.table("users").count("is_active");
```

Count multiple columns by passing an array as the argument.

```ts
db.table("users").count(["is_active", "is_banned"]);
```

To specify an alias for the count result, you can pass the second parameter.

```ts
db.table("users").count("is_active", "a");
```

Use `countDistinct` to add distinct expression inside your count statement.

```ts
db.table("users").countDistinct("is_active", "a");
```

## Pagination

Typically, pagination can be done in SQL by using limit and offset. Limit is the maximum number of record to return, and the offset is the number of records to skip. Here is an example.

```ts
db.table("users").limit(5).offset(10);
```

## Insert / Replace

To insert a new record, use `insert`.

```ts
db.table("users").insert({ email: "a@b.com", age: 16 });
```

To insert multiple records in a single query, you can pass an array instead.

```ts
db.table("users").insert([
  { email: "a@b.com", age: 16 },
  { email: "b@c.com", age: 17 },
  { email: "c@d.com", age: 18 },
]);
```

Another way to insert a record is by using replace. It will look for `PRIMARY` and `UNIQUE` constraints. If something matched, it gets removed from the table and creates a new row with the given values.

```ts
db.table("users").replace({ email: "a@b.com", age: 16 });

db.table("users").replace([
  { email: "a@b.com", age: 16 },
  // ...
]);
```

## Update

To perform update, you need to chain `update` method and pass the values you want to update. The value parameter is a key-value pair which represents the column name and it's value. This method can be chained with other constraints such as `where`, `not`, `or`, `limit`, etc.

```ts
db.table("users").where("id", 1).update({ email: "a@b.com" });
```

## Delete

The only thing you need to do to perform DELETE query is by adding `delete` method to the query builder.

```ts
db.table("users").where("id", 1).delete();
```

## Returning

Returning is a statement that typically used in INSERT or REPLACE query. Note that this feature only works in PostgreSQL. However, you can still build this query in MySQL or SQLite connection.

```ts
db.table("users").insert({ email: "a@b.com" }).returning("id", "email");
```
