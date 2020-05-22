# Jungle ORM

Type-Safe SQL Query Builder for JavaScript and TypeScript.

## Highlights

- Schema Builder
- Type-Safe Query Builder

## Examples

### Select all

```ts
const queryBuilder = new QueryBuilder("users");
const query = queryBuilder.where("email = ?", "a@b.com").first().getSQL();
// query = "SELECT * FROM users WHERE email = 'a@b.com'"
```

### Limit result

```ts
const queryBuilder = new QueryBuilder("users");
const query = queryBuilder.where("email = ?", "a@b.com").limit(5).getSQL();
// query = "SELECT * FROM users WHERE email = 'a@b.com'"
```

### Multiple where clause

```ts
const queryBuilder = new QueryBuilder("users");
const query = queryBuilder
  .where("email = ?", "a@b.com")
  .andWhere("name = ?", "john")
  .getSQL();
// query = "SELECT * FROM users WHERE email = 'a@b.com' AND name = 'john'"
```
