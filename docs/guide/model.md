# Model

Cotton provides a type-safe way to work with your database using models. You can define a model by creating a plain class decorated with `@Model`.

```ts
import { Model, Column } from "https://deno.land/x/cotton/mod.ts";

@Model("users")
class User {
  @Primary()
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

> A model must have a primary column. And at this point, Cotton only supports auto incremental primary keys.

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

## TypeScript configuration

Keep in mind that this feature requires a custom TypeScript configuration to tell Deno that we want to use [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html), which currently still an experimental feature.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
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

Once you get the manager instance, you can basically perform anything to that models. Let's start by creating a new user!

```ts
const user = new User();
user.email = "a@b.com";
user.age = 16;
user.createdAt = new Date();
await manager.save(user);
```

### Finding records

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

### Relations

Cotton allows you to setup model relations with ease. Currently, Cotton only supports one-to-many relations.

```ts
@Model()
class User {
  @Primary()
  id!: number;

  @Column()
  email: string;

  @Relation(RelationType.HasMany, () => User, "user_id")
  posts: Post[];
}

@Model()
class Post {
  @Primary()
  id!: number;

  @Column()
  title: string;

  @Relation(RelationType.BelongsTo, () => User, "user_id")
  user: User;
}
```

As you can see, a user can have multiple posts, but the a post belongs to a single user.

### Saving relations

Saving relations can be done using `save` method alone.

```ts
const post1 = new Post();
post1.title = "Post 1";
await manager.save(post1);

const post2 = new Post();
post2.title = "Post 2";
await manager.save(post2);

const user = new User();
user.email = "a@b.com";
user.posts = [post1, post2];
await manager.save(user);
```

You also can reverse it.

```ts
const user = new User();
user.email = "a@b.com";
await manager.save(user);

const post1 = new Post();
post1.title = "Post 1";
post1.user = user;
await manager.save(post1);

const post2 = new Post();
post2.title = "Post 1";
post2.user = user;
await manager.save(post2);
```

### Fetching relations

By default, `find` and `findOne` doesn't fetch your relations. To fetch them, you need to explicitly say which relations you want to include.

```ts
const users = await User.find({ relations: ["posts"] });
const post = await Post.findOne({ relations: ["user"] });
```

## Base model

If you find it difficult to use model manager, base model might be a perfect solution for you.

In a nutshell, base model is a model that extends the `BaseModel` class. This class provides you the exact same functionalities as the model manager, but you can call them directly from your model class via static methods.

```ts
@Model("users")
class User extends BaseModel {
  @Column()
  email!: string;

  @Column()
  age: number;
}
```

## What's the difference?

The most obvious difference between model manager and base model is that model manager is model agnostic. Which means it will work with any models you have.

In model manager, your model is just a plain class that only act as a representation of your data in the database but has no access to it. In order to do interact with the database, you need to use your model to the manager. Some people find it safer than the base models because it seperates the business logic and the schema. You can see this pattern a lot in Java frameworks such as Hibernate.

base models on the other hand, your models act as both model manager and the schema. You can see this pattern in Laravel's Eloquent and ActiveRecord. A lot of people find this pattern easier to use because once you have access to the model class, you can basically do anything with it.
