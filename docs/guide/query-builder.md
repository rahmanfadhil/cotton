# Query Builder

### Basic query

```ts
await db
  .table("users")
  .where("email", "a@b.com")
  .where("name", "john")
  .execute();
// SELECT * FROM users WHERE email = 'a@b.com' AND name = 'john';
```

### orWhere and notWhere

```ts
await db.table("users").notWhere("name", "kevin").execute();
// SELECT * FROM users WHERE NOT name = 'kevin';

await db
  .table("users")
  .where("name", "kevin")
  .orWhere("name", "john")
  .execute();
// SELECT * FROM users WHERE name = 'kevin' OR name = 'john';
```

### Select columns

```ts
await db.table("users").select("email").execute();
// SELECT (email) FROM users;

await db.table("users").select("id", "email").execute();
// SELECT (id, email) FROM users;

await db.table("users").select("id").select("email").execute();
// SELECT (id, email) FROM users;
```

### Pagination

```ts
await db.table("users").limit(5).offset(5).execute(); // Skip 5 row and take 5
// SELECT * FROM users LIMIT 5 OFFSET 5;
```

### Insert data

```ts
await db
  .table("users")
  .insert({
    email: "a@b.com",
    age: 16,
    created_at: new Date("5 June, 2020"),
  })
  .execute();
// INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '2020-06-05 00:00:00');
```

### Replace data

```ts
await db
  .table("users")
  .replace({
    email: "a@b.com",
    age: 16,
    created_at: new Date("5 June, 2020"),
  })
  .execute();
// REPLACE INTO users (email, age, created_at) VALUES ('a@b.com', 16, '2020-06-05 00:00:00');
```

### Delete data

```ts
await db.table("users").where("email", "a@b.com").delete().execute();
// DELETE FROM users WHERE email = 'a@b.com';
```

### Update data

```ts
await db
  .table("users")
  .where("email", "a@b.com")
  .update({ name: "John" })
  .execute();
// UPDATE users SET name = 'John' WHERE email = 'a@b.com';
```
