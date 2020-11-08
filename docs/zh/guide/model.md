# 模型

Cotton 提供了一种类型安全的方式来使用模型处理数据库。 你可以通过创建一个装饰有以下内容的普通类来定义模型：`@Model`。

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

`@Model` 装饰器接受一个可选参数作为模型的表名。 默认情况下，如果类名是 `User`，它将在数据库中查找 `user` 表。

> 模型必须具有主列。 在这点上，Cotton 仅支持自动增量主键。

然后，通过用 `@Column` 标记类属性来定义每列。 Cotton 足够聪明，可以使用 `TypeScript` 类型来确定该特定列的数据类型。 但是，你仍然可以通过传递`type`选项来自定义列类型，如下所示。

```ts
@Column({ type: DataType.String })
email!: string;
```

仍有大量定制空间。 你可以使用 `default` 提供列的默认值，并使用 `name` 为列定义自定义名称，等等。

```ts
@Column({ default: false })
isActive!: string;

@Column({ default: () => new Date() })
createdAt!: Date;

@Column({ name: "created_at" }) // different column name on the database
createdAt!: Date;
```

## TypeScript 配置

请记住，此功能需要自定义 `TypeScript` 配置，以告知 `Deno` 我们要使用`TypeScript` [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)，该功能目前仍是实验性功能。

```json
// tsconfig.json

{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## 模型管理器

为了在模型中执行查询，你可以使用数据库连接实例提供的模型管理器。

```ts
const db = await connect({
  type: "sqlite",
  // other options...
});

const manager = db.getManager();
```

一旦你获得模型管理器实例，你可以在模型上执行任何操作。 让我们来以创建一个用户开始。

```ts
const user = new User();
user.email = "a@b.com";
user.age = 16;
user.createdAt = new Date();
await manager.save(user);
```

为了更新已经存在的模型，你可以再次执行 `save` 操作。Cotton 会智能的决定是要更新还是插入数据。

```ts
user.email = "b@c.com";
await manager.save(user);
```

你也可以给 `save` 通过传入一个数组来执行多条数据的插入和更新。

```ts
const user1 = new User();
user1.email = "a@b.com";
await manager.save(user1);
user1.email = "b@c.com";

const user2 = new User();
user2.email = "a@b.com";

const post1 = new Post();
post1.title = "Spoon";

await manager.save([
  user1, // Since it's already saved, it will perform update.
  user2, // This record will inserted.
  post1, // You can also save a totally different model at once!
]);
```

### 查询模型

任何你想查询的内容都可以通过 `query` 来获取。

```ts
const users = await manager.query(User).all();

for (const user of users) {
  console.log(user); // User { email: 'a@b.com', age: 16, ... }
}
```

`query` 方法返回 `ModelQuery` 的实例，该实例的工作方式类似于查询生成器。 你还可以通过将记录与 `where` 、`or` 和 `not` 连接起来，在一定条件下过滤记录。

```ts
await manager.query(User).where("email", "a@b.com").all();
```

如果要获取第一个，可以用 `first`代替 `all`。

```ts
const user = await manager.query(User).where("email", "a@b.com").first();

console.log(user); // User { email: 'a@b.com', age: 16, ... }
```

## 计数

你可以通过 `count` 方法统计到满足条件的数据。

```ts
const count = await manager.query(User).where("isActive", true).count();
```

## 更新模型

要一次更新多个模型，可以使用 `update` 方法并传递数据。 这不会返回更新的模型，而是使用 `save`。

```ts
await manager.query(User).where("isActive", true).update({ isActive: false });
```

## 删除模型

Manager API 具有 `remove` 方法，使你可以删除从数据库中的模型。

```ts
await manager.remove(user);
```

你还可以通过传递数组作为参数来删除多个模型。 这将在单个查询中删除所有模型。

```ts
await manager.remove([user1, user2, user3]);
```

要删除符合给定条件的模型，你可以使用 `delete` 方法删除。

```ts
await manager.query(User).where("isActive", false).delete();
```

### 关系

Cotton 使你可以轻松设置模型关系。 当前，Cotton 仅支持一对多关系。

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

如你所见，一个用户可以有多个帖子，但是一个帖子属于一个用户。

### 保存关系

保存关系可以单独使用 `save` 方法来完成。

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

你也可以将其反转。

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

### 获取关系

默认情况下，`find` 和 `findOne` 不会获取你的关系。 要获取它们，你需要明确说明要包含的关系。

```ts
const users = await manager.query(User).include("posts").all();
const post = await manager.query(Post).include("user").first();
```

## 基础模型

如果发现难以使用模型管理器，则基本模型可能是你的理想解决方案。

简而言之，基础模型是扩展 `BaseModel`类的模型。 该类为你提供与模型管理器完全相同的功能，但是你可以直接从模型类中调用它们。

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

使用基本模型时，你需要做的最重要的事情是将这些模型注册到数据库连接中。 在执行查询之前未注册模型会导致致命错误。

```ts
const db = await connect({
  type: "sqlite",
  // 其他配置...
  models: [User],
});
```

这是对基本模型执行查询的方法。

```ts
const user = await User.query().where("id", 1).first();
```

插入新的条目：

```ts
const user = new User();
user.email = "a@b.com";
user.age = 16;
user.createdAt = new Date();
await user.save();

// 或者...
const user = await User.insert({
  email: "a@b.com",
  age: 16,
  createdAt: new Date(),
});
```

移除一个条目：

```ts
const user = await User.query().where("id", 1).first();
await user.remove();
```

## 他们之间的区别

模型管理器和基本模型之间最明显的区别是模型管理器与模型无关。 这意味着它将与你拥有的任何模型一起使用。

在模型管理器中，你的模型只是一个普通类，仅充当数据库中表模式的表示。 为了与数据库进行交互，你需要使用模型管理器。 某些人发现它比基本模型更安全，因为它将业务逻辑和模式定义分开。 你可以在Java框架， 例如[Hibernate](https://hibernate.org) 中看到很多这种模式。

另一方面，基于模型，你的模型既充当模型管理器又充当架构。 你可以在 [Laravel's Eloquent](https://laravel.com/docs/7.x/eloquent) 和 [ActiveRecord](https://guides.rubyonrails.org/active_record_basics.html) 中看到这种模式。 许多人发现此模式更易于使用，因为一旦访问了模型类，就可以使用它进行任何操作。

## 我应该用哪一个？

完全取决于你！ 我个人认为这取决于你来自哪里。 如果你来自 Java 开发，并且已经熟悉 JPA ，则可能要使用模型管理器。 但是，如果你来自 PHP、Ruby 或 Node.js，则基本模型对你来说似乎更自然。
