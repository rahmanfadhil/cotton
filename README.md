# cotton

> This library is in the very early stage, any [contribution](CONTRIBUTING.md) means a lot!

SQL Database Toolkit for Deno.

## Features

- 🚧 Query Builder
- ❌ Migrations
- ❌ Object-Relational Mapper

## Examples

### Select all

```ts
import { QueryBuilder } from "https://deno.land/x/cotton/mod.ts";
const queryBuilder = new QueryBuilder("users");
const query = queryBuilder.where("email = ?", "a@b.com").first().getSQL();
// query = "SELECT * FROM users WHERE email = 'a@b.com'"
```

### Limit result

```ts
import { QueryBuilder } from "https://deno.land/x/cotton/mod.ts";
const queryBuilder = new QueryBuilder("users");
const query = queryBuilder.where("email = ?", "a@b.com").limit(5).getSQL();
// query = "SELECT * FROM users WHERE email = 'a@b.com'"
```

### Multiple where clause

```ts
import { QueryBuilder } from "https://deno.land/x/cotton/mod.ts";
const queryBuilder = new QueryBuilder("users");
const query = queryBuilder
  .where("email = ?", "a@b.com")
  .andWhere("name = ?", "john")
  .getSQL();
// query = "SELECT * FROM users WHERE email = 'a@b.com' AND name = 'john'"
```
