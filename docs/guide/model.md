# Model

Cotton provides a type-safe way to work with your database using models. You can define a model by creating a plain class decorated with `@Model`.

```ts
import { Model, Column } from "https://deno.land/x/cotton/mod.ts";

@Model("users")
class User {
  @PrimaryColumn()
  id: number;

  @Column()
  email!: string;

  @Column()
  age!: number;

  @Column()
  createdAt!: Date;
}
```

The `@Model` decorator takes an optional argument for the table name of your model. By default, if the class name is `User`, it will look up for `user` table in your database.

> A model must have a primary column. And at this point, Cotton only supports auto incremented primary keys.

Then, you define each columns by marking the class properties with `@Column`. Cotton is smart enough to determine the data type of that particular column using TypeScript types. However, you can still customize your column types by passing the `type` option like below.

```ts
@Column({ type: ColumnType.String })
email!: string;
```

There are still a plenty of room for customization. You can provide a default value of a column with`default`, define a custom name for your column using `name`, prevent `null` or `undefined` value saved to the database using `isNullable`, and much more.

```ts
@Column({ isNullable: false }) // default: true
email!: string;

@Column({ default: false })
isActive!: string;

@Column({ default: () => new Date() })
createdAt!: Date;

@Column({ name: "created_at" }) // different column name on the database
createdAt!: Date;
```

## Model manager

In order to perform queries within a model, you can use the model manager provided by the database connection.

```ts
const db = await connect({
  type: "sqlite",
  // other options...
});

const manager = db.getManager();
```

Once you get the manager instance, you can basically perform anything to that model. Let's start by creating a new user!

```ts
const user = new User();
user.email = "a@b.com";
user.age = 16;
user.createdAt = new Date();
await manager.save(user);
```

# Finding records

To fetch records from a model, you can use the `find` method.

```ts
await manager.find(User);
```

You can also filter records by a certain conditions.

```ts
await manager.find(User, { where: { email: "a@b.com" } });
```

By default, it will fetch all records that match the conditions, which is not so efficient. However, you can easlily paginate those records by passing `limit` and `offset` options.

```ts
// Get the first ten users
await manager.find(User, { limit: 10 });

// Read the next page
await manager.find(User, { limit: 10, offset: 10 });
```
