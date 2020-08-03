# Serializer

Serializing is a technique in programming where you transform a class instance into plain object and vice versa. Since the [Model](model.md) API doesn't have any validation or serialization feature, Cotton provide a seperate set of tools for you to do such things.

## Getting started

To get started, you can decorate your model properties with `@Serializable` decorator.

```ts
class User {
  @Column()
  @Serializable({ isRequired: true }) // make the property required.
  email: string;

  @Column()
  @Serializable() // default serializable property.
  age: string;

  @Column()
  @Serializable({ isHidden: true }) // hide property in serialization by default.
  password: string;

  @Column()
  @Serializable({ isReadonly: true }) // prevent property value to be changed.
  createdAt: boolean;
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
