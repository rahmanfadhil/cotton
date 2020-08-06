# Serializer

Serializing is a technique in programming where you transform a class instance into plain object and vice versa. Since the [Model](model.md) API doesn't come with validation or serialization feature, Cotton provide a seperate set of tools for you to do such things.

## Getting started

To get started, you can decorate your model properties with `@Serializable` decorator.

```ts
@Model()
class User extends BaseModel {
  @Column()
  @Serializable({ isRequired: true }) // make the property required.
  email: string;

  @Column()
  @Serializable() // default serializable property.
  age: number;

  @Column()
  @Serializable({ isHidden: true }) // hide property in serialization by default.
  password: string;

  @Column()
  @Serializable({ isReadonly: true }) // prevent property value to be changed.
  createdAt: Date;
}
```

# Deserializing models "loading"

You can deserialize a model (transform plain JavaScript object to model instance) by using `load` method provided by the `Serializer`. The values can be anything, and the serializer by default will transform the type into the TypeScript type you define for that property.

```ts
const serializer = new Serializer(User);
const user = serializer.load({
  email: "a@b.com",
  age: 16,
  created_at: "2020-08-06T00:15:36.000Z",
});
```

Result:

```
User { email: 'a@b.com', age: 16, created_at: 2020-08-06T00:15:36.000Z }
```

You can also load multiple models using `loadMany` method.

```ts
const serializer = new Serializer(User);
const users = serializer.loadMany([
  { email: "a@b.com", age: 16, created_at: "2020-08-06T00:15:36.000Z" },
  { email: "a@b.com", age: 17, created_at: "2020-08-06T00:15:36.000Z" },
]);
```

Result:

```
[
  User { email: 'a@b.com', age: 16, created_at: 2020-08-06T00:15:36.000Z },
  User { email: 'b@c.com', age: 17, created_at: 2020-08-06T00:15:36.000Z }
]
```

You can also load multiple models using `loadMany`.

```ts
const serializer = new Serializer();
```

## Serializing model instances "dumping"

Once you get your model instances, you can serialize them into a JSON compatible objects by using `dump`.

```ts
const user = await User.query().find();

serializer.dump(user); // { email: 'a@b.com', age: 16, created_at: '2020-08-06T00:15:36.000Z' }
```

The `dump` method also accept an array if you want to serialize multiple instances.

```ts
const users = await User.query().all();
serialize.dump(users); // [{ email: 'a@b.com', ... }, ...]
```
