# 查询构建器

Cotton 提供了一个简单，功能强大且与数据库无关的查询构建器。 你可以轻松地使用它构造 SQL 查询语句。

当你一旦建立连接后，就可以使用查询构建器上的 `table` 方法。

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

`table` 方法只使用你想获取数据的表的名称这一个参数。该方法返回一个 `QueryBuilder` 实例，这个实例包含了很多构造查询语句的方法。你可以链接所需的所有方法，去添加更多约束或语句。

```ts
// SELECT * FROM `users` WHERE `id` = ?;
const users = db.table("users").where("id", 1).execute();
```

如你所见，这些值在查询字符串中被占位符替换，并由数据库处理以防止 SQL 注入。

如果你只想获取 SQL 查询字符串而又不想运行它，则可以在语句末尾使用 `toSQL` 替换 `execute`。

```ts
const { text, values } = db.table("users").where("id", 1).toSQL();
console.log(text); // "SELECT * FROM `users` WHERE `id` = ?;"
console.log(values); // [1]
```

## WHERE

我们在 SQL 查询中最常做的事情是使用 `WHERE` 子句来查询结果。

通过 `WHERE` 子句查询记录是我们使用 SQL 查询最常见的事情之一。 在 Cotton 中，只需使用 `where` 方法即可轻松添加任何 where 子句。

```ts
db.table("users").where("id", 1);
```

第一个参数是列名，第二个参数是期望值。 默认情况下，使用 `=` 运算符，该运算符将检查值是否相等。你可以使用 `Q` 帮助指令来自定义 SQL 表达式，从而自定义查询操作。

```ts
db.table("users").where("id", Q.gt(1)); // SELECT * FROM `users` WHERE `id` > 1;
db.table("users").where("id", Q.in([1, 2, 3])); // SELECT * FROM `users` WHERE `id` IN (1, 2, 3);
db.table("users").where("id", Q.between([1, 5])); // SELECT * FROM `users` WHERE `id` BETWEEN 1 AND 5
```

你可以通过 `Q` 帮助指令访问以下有效的表达式。

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

当前，有效的值有 `boolean`， `string`， `null`， `number` 和 `Date`。

```ts
query
  .table("users")
  .where("email", "a@b.com")
  .where("age", Q.gte(16))
  .where("is_active", true)
  .where("birthday", Q.lt(new Date("7 July, 2020")));
```

有时你想排除某些符合给定条件的记录。可以使用 `not`。

```ts
query.table("users").not("is_active", true);
```

或者，如果你要查找其中一个条件为真的记录，可以使用 `or` 。

```ts
query.table("users").where("name", "John").or("name", "Jane");
```

## SELECT

默认情况下，查询构建器使用 `*` 将选中表中的所有列。 但是，您可以通过 `select` 来选择查询的列。

```ts
db.table("users").select("email");
```

要查询多个列，可以将多个字符串作为参数传递给 `select`，也可以链式操作。

```ts
db.table("users").select("email", "age", "is_active");

// Alternatively...
db.table("users").select("email").select("age").select("is_active");
```

如果只想查询一个值，可以启用 `distinct` 方法进行查询。

```ts
db.table("users").select("email").distinct();
```

## GROUP BY & HAVING

可以通过使用 `groupBy` 来添加一个 `GROUP BY` 查询。

```ts
db.table("users").groupBy("category");
db.table("users").groupBy("users.category"); // explicit table name
```

大多数时候，`GROUP BY` 表达式与 `HAVING` 配对使用以过滤记录，下面是你可以执行的操作：

```ts
db.table("users").groupBy("category").having("is_active", false);
```

## ORDER

您可以使用 `order` 对列进行排序。

```ts
db.table("users").order("age");
```

默认情况下，将按升序排序。 但你可以通过传递第二个参数来更改此方式。

```ts
db.table("users").order("age", "DESC"); // or ASC
```

要对多列进行排序，可以使用链式操作。

```ts
db.table("users").order("age", "DESC").order("created_at");
```

## COUNT

你可以使用 `count` 方法计算符合给定条件的记录数。

```ts
db.table("users").count("is_active");
```

将数组作为参数来计算多列。

```ts
db.table("users").count(["is_active", "is_banned"]);
```

可以通过传递第二个参数为计数结果指定别名。

```ts
db.table("users").count("is_active", "a");
```

使用 `countDistinct` 在 count 语句中添加不同的表达式。

```ts
db.table("users").countDistinct("is_active", "a");
```

## OFFSET & LIMIT

通常，可以使用限制和偏移量在 SQL 中完成分页。 限制是要返回的最大记录数，而偏移量是要跳过的记录数。 下面是一个例子。

```ts
db.table("users").limit(5).offset(10);
```

## INSERT / REPLACE

使用 `insert` 插入一条新的记录。

```ts
db.table("users").insert({ email: "a@b.com", age: 16 });
```

在一个查询语句中要插入多个记录，你可以将传递一个对象改为传递一个数组对象。

```ts
db.table("users").insert([
  { email: "a@b.com", age: 16 },
  { email: "b@c.com", age: 17 },
  { email: "c@d.com", age: 18 },
]);
```

插入记录的另一种方法是使用 `replace` 。 它将查找 `PRIMARY` 和 `UNIQUE` 约束。 如果匹配，则将其从表中删除并使用给定值创建新的记录。

```ts
db.table("users").replace({ email: "a@b.com", age: 16 });

db.table("users").replace([
  { email: "a@b.com", age: 16 },
  // ...
]);
```

## UPDATE

要执行更新，您需要使用 `update` 方法并传递要更新的值。 value 参数是一个键-值对，代表列名及其值。此方法可以与其他约束（例如，`where`，`not`，`or`，`limit` 等）一起使用。

```ts
db.table("users").where("id", 1).update({ email: "a@b.com" });
```

## DELETE

通过在查询构造器中添加 `delete` 方法 去执行 DELETE 操作。

```ts
db.table("users").where("id", 1).delete();
```

## RETURNING

返回是通常在 INSERT 或 REPLACE 查询中使用的语句。 请注意，此功能仅在PostgreSQL 中有效。但是，你仍然可以在 MySQL 或 SQLite 连接中构建此查询。

```ts
db.table("users").insert({ email: "a@b.com" }).returning("id", "email");
```
