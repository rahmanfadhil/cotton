# Model

A model is nothing more than a class that extends `Model`.

```ts
import { Model } from "https://deno.land/x/cotton/mod.ts";

class User extends Model {
  static tableName = "users";

  @Field()
  email!: string;

  @Field()
  age!: number;

  @Field()
  created_at!: Date;
}
```

To do CRUD operations to our model, we can use the provided method in our model:

```ts
const user = await User.findOne(1); // find user by id
console.log(user instanceof User); // true
```

```ts
const users = await User.find(); // find all users

for (const user in users) {
  console.log(user.email);
}
```

To save the current model to the database, use the `save` method.

```ts
const user = new User();
user.email = "a@b.com";
user.age = 16;
user.created_at = new Date("1 June, 2020");
await user.save();
```

You also can use the `insert` method to create the model instance and save it to the database at the same time.

```ts
const user = await User.insert({
  email: "a@b.com",
  age: 16,
  created_at: new Date("1 June, 2020"),
});
```

To insert multiple records, you can simply pass an array as the parameter.

```ts
const user = await User.insert([
  { email: "a@b.com", age: 16, created_at: new Date("1 June, 2020") },
  { email: "b@c.com", age: 17, created_at: new Date("2 June, 2020") },
]);
```
