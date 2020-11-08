# 快速开始

这有一个使用 Cotton 创建的 Deno 项目。

```ts
import { connect } from "https://deno.land/x/cotton@v0.7.2/mod.ts";

const db = await connect({
  type: "sqlite",
  database: "db.sqlite3",
});
```

要在项目中使用 Cotton，你可以从文件中的[deno.land/x](https://deno.land/x）导入 `cotton` 包。 我们强烈建议你使用语义版本控制，方法是在导入 URL 中明确告诉 Deno 你要使用哪个版本。

通常，你要做的第一件事是创建与数据库的连接。 在这里，我们使用 `connect` 并传递数据库配置。 你可以在[此处](connection.md)阅读更多有关连接的信息。

连接数据库后，就可以执行任何操作，例如执行SQL查询。

```ts
const users = await db.query("SELECT * FROM users");

for (const user of users) {
  console.log(user); // { email: 'a@b.com', age: 16, ... }
}
```

你可以通过下面这些链接了解有关 Cotton 的更多信息。 祝用的开心！ 😃

- [创建连接](connection)
- [查询构造器](query-builder.md)
- [对象-关系映射](model.md)
- [数据库迁移](migrations.md)
