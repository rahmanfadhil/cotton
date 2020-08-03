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

You can deserialize a model (transform plain JavaScript object to model instance) by using `load` method provided by the `Serializer`.

```ts
const serializer = new Serializer(User);
serializer.load({ email: "a@b.com", age: 16 });
```

You can also load multiple models using `loadMany` method.

```ts
const serializer = new Serializer(User);
serializer.loadMany({ email: "a@b.com", age: 16 });
```

You can also load multiple models using `loadMany`.

```ts
const serializer = new Serializer();
```

## Serializing model instances "dumping"

Once you get your model instances, you can serialize them into a JSON compatible objects by using `dump`.

```ts
const user = await User.query().find();

serializer.dump(user); // { email: 'a@b.com', age: 16, created_at: '2020-08-04 00:00:00' }
```

The `dump` method also accept an array if you want to serialize multiple models.

```ts
const users = await User.query().all();
serialize.dump(users); // [{ email: 'a@b.com', ... }, ...]
```
