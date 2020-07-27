# Models

Cotton provides a type-safe way to work with your database using models. You can define a model by creating a plain class decorated with `@Model`.

```ts
import { Model, Column } from "https://deno.land/x/cotton/mod.ts";

@Model("users")
class User {
  @Primary()
  id!: number;

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
@Column({ type: DataType.String })
email!: string;
```

There are still a plenty of room for customization. You can provide a default value of a column with`default`, define a custom name for your column using `name`, and much more.

```ts
@Column({ default: false })
isActive!: string;

@Column({ default: () => new Date() })
createdAt!: Date;

@Column({ name: "created_at" }) // different column name on the database
createdAt!: Date;
```

## TypeScript configuration

Keep in mind that this feature requires a custom TypeScript configuration to tell Deno that we want to use TypeScript [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html), which currently still an experimental feature.

```json
// tsconfig.json

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

Alternatively, you can create a new item by using `insert`.

```ts
const user = await manager.insert(User, {
  email: "a@b.com",
  age: 16,
  createdAt: new Date(),
});
```

### Querying models

Everything you need to query a model is in the `query` method.

```ts
const users = await manager.query(User).all();

for (const user of users) {
  console.log(user); // User { email: 'a@b.com', age: 16, ... }
}
```

The `query` method returns an instance of `ModelQuery` which works like a query builder. You can also filter records by a certain conditions by chaining it with `where`, `or`, and `not`.

```ts
await manager.query(User).where("email", "a@b.com").all();
```

To fetch a single record, you can use `first` instead of `all`.

```ts
const user = await manager.query(User).where("email", "a@b.com").first();

console.log(user); // User { email: 'a@b.com', age: 16, ... }
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

  @HasMany(() => User, "user_id")
  posts: Post[];
}

@Model()
class Post {
  @Primary()
  id!: number;

  @Column()
  title: string;

  @BelongsTo(() => User, "user_id")
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
const users = await manager.query(User).include("posts").all();
const post = await manager.query(Post).include("user").first();
```

## Base model

If you find it difficult to use model manager, base model might be a perfect solution for you.

In a nutshell, base model is a model that extends the `BaseModel` class. This class provides you the exact same functionalities as the model manager, but you can call them directly from your model class.

```ts
@Model("users")
class User extends BaseModel {
  @Column()
  email!: string;

  @Column()
  age: number;

  @Column()
  createdAt!: Date;
}
```

The most important thing you need to do when working with base models is registering those models to your database connection. Not registering your models before executing queries with it can cause fatal errors.

```ts
const db = await connect({
  type: "sqlite",
  // other configs...
  models: [User],
});
```

Here's how to can perform query to a base model.

```ts
const user = await User.query().where("id", 1).first();
```

Inserting new item:

```ts
const user = new User();
user.email = "a@b.com";
user.age = 16;
user.createdAt = new Date();
await user.save();

// Alternatively...
const user = await User.insert({
  email: "a@b.com",
  age: 16,
  createdAt: new Date(),
});
```

Removing an item:

```ts
const user = await User.query().where("id", 1).first();
await user.remove();
```

## What's the difference?

The most obvious difference between model manager and base model is that model manager is model agnostic. Which means it will work with any models you have.

In model manager, your model is just a plain class that only act as a representation of your table schema in the database. In order to do interact with the database, you need to use your model manager. Some people find it safer than the base models because it seperates the business logic and the schema definition. You can see this pattern a lot in Java frameworks such as [Hibernate](https://hibernate.org).

Base models on the other hand, your models act as both model manager and the schema. You can see this pattern in [Laravel's Eloquent](https://laravel.com/docs/7.x/eloquent) and [ActiveRecord](https://guides.rubyonrails.org/active_record_basics.html). A lot of people find this pattern easier to use because once you have access to the model class, you can basically do anything with it.

## Which one should I use?

It's really up to you! I personally think it depends on where you came from. If you came from Java development and you already familiar with JPA, you probably want to use model manager. However, if you came from PHP, Ruby, or Node.js, base model probably looks more natural to you.
