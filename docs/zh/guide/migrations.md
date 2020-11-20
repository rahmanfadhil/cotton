# 迁移

我们的标语使用 _database toolkit_ 代替 _ORM_ 的原因是因为 Cotton 提供的不仅仅是 ORM。我们提供了一组工具，可帮助你管理使用数据库的 Deno 应用程序。我们希望确保你在开发应用程序时无需在多个工具中来回切换。

在本节中，我们将教你如何使用 Cotton 中的迁移功能。

## 什么是迁移？

如果你不知道什么是迁移，可以将其视为数据库的版本控制（例如[Git]（https://git-scm.com））。假设你正在与团队合作。突然，你意识到 `users` 表中缺少 `email` 列。 此时，你可能会说 _"好吧，我只需要告诉其他所有人在他们的数据库上运行此 SQL 查询语句，这样代码就可以工作！"_ 对吗？

但问题在于，无论你是开发小型练习项目还是大型企业项目，这种事情会一直发生。这就是为什么你需要考虑使用迁移的原因。当某人想要更改数据库中的某些内容时，他们要做的就是添加新迁移，该迁移将对数据库执行查询。

关于此功能的妙处，在于你不仅可以 **使用** 新的迁移，还可以 **回滚** 到数据库的先前版本。当出现问题时，这对于调试或回滚你的应用程序非常有用。

## 开始入门

你需要做的第一件事是安装 Cotton CLI。

```
$ deno install --allow-net --allow-read --allow-write -n cotton https://deno.land/x/cotton@v0.7.2/cli.ts
```

安装完成后，你可以在终端中键入 `cotton` 以验证是否安装成功。

```
$ cotton

Cotton CLI v0.1.0

Usage:
  cotton [command] [options]


Options:
  -h, --help
    Prints help information
  -c, --config
    Set the location of your database configuration (default: "ormconfig.json")


Commands:
  migration:create  Creates a new migration file
  migration:up      Apply all available migrations
  migration:down    Revert the last "batch" migrations
  migration:info    Get the status of all migrations
```

如你所见，我们有一堆命令可用于管理迁移。让我们从创建一个新的迁移文件开始。

## 创建迁移

```
$ cotton migration:create --name CreateUserTable
```

这条命令将在当前目录内创建一个包含迁移文件的 `migrations/` 文件夹。这些文件中都有其自己的时间戳，可以帮助我们确定这些迁移的正确执行顺序。

```
$ tree migrations
migrations
└── 20200717134438_CreateUserTable.ts
```

让我们看一下迁移文件中的内容。

```ts
import { Schema } from "https://deno.land/x/cotton/mod.ts";

export async function up(schema: Schema) {
  // Do something...
}

export async function down(schema: Schema) {
  // Do something...
}
```

代码非常简单。 我们有一个 `up` 功能来 **应用** 此迁移到数据库，还有一个 `down` 功能来 **恢复** 到以前的版本。

要应用现有的迁移，你所要做的就是运行 `cotton migration：up`。

```
$ cotton migration:up

Migrating: 20200717134438_CreateUserTable
Migrated:  20200717134438_CreateUserTable
```

返回数据库的先前版本也超级简单。

```
$ cotton migration:down

Reverting: 20200717134438_CreateUserTable
Reverted:  20200717134438_CreateUserTable
```

默认情况下，将还原到上一个迁移版本，该版本可以包含多个迁移。此外，你还可以通过传递 `--steps` 选项来指定要还原的迁移数量。

```
$ cotton migration:down --steps 1
```

## 迁移日志

你可以通过 `migration:info` 命令查看所有可用的迁移。这将打印出每个迁移，并检查是否已将其应用于数据库。

```
Applied  Migration
-------  ------------------------------
Yes      20200717134438_CreateUserTable
```
