# Migrations

The reason why we use _database toolkit_ instead of _ORM_ for our tagline is because Cotton offers more than just an ORM. We're offering a set of tools that helps you to manage your Deno apps that use a database. We want to make sure that you don't need to jump into multiple tools while developing your apps.

In this section, we're going to show you how to use the migrations feature in Cotton.

## What is migration?

In case you have no idea about what migrations are, think of it as a version control (like [Git](https://git-scm.com)) for your database. Let's say you're working with your team. Suddenly, you realised that your `users` table is missing an `email` column. At this point, you might say _"Well, I just need to tell all my friends to run this SQL query on their database so that the code will work!"_, right?

Well, the problem is that this thing can happen all the time, whether you're working on a small exercise project or a large-scale enterprise project. This is why you need to consider using migrations. When someone wants to change something on the database, all they have to do is add a new migration which will perform queries to the database.

The cool thing about this feature is not only you can **apply** new migrations, but also **rollback** to the previous versions of your database. This is very helpful for debugging or downgrading your app when something went wrong.

## Getting started

The first thing you need to do is install the Cotton CLI.

```
$ deno install --allow-net --allow-read --allow-write -n cotton https://deno.land/x/cotton@v0.7.1/cli.ts
```

Once the installation is finished, you can type `cotton` in your terminal to verify your installation.

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

As you can see, we have a bunch of commands which we can use to manage our migrations. Let's start by creating a new migration file.

## Creating a migration

```
$ cotton migration:create --name CreateUserTable
```

This will create a `migrations/` folder inside your current directory which contains your migration files. Each of those files has it's own timestamp which helps us determine the right execution order of those migrations.

```
$ tree migrations
migrations
└── 20200717134438_CreateUserTable.ts
```

Let's take a look at what's inside that migration file.

```ts
import { Schema } from "https://deno.land/x/cotton/mod.ts";

export async function up(schema: Schema) {
  // Do something...
}

export async function down(schema: Schema) {
  // Do something...
}
```

The code is very straight forward. We have an `up` function to **apply** this migration to the database, and a `down` function to **revert** it back to the previous version.

To apply existing migrations, all you have to do is run `cotton migration:up`.

```
$ cotton migration:up

Migrating: 20200717134438_CreateUserTable
Migrated:  20200717134438_CreateUserTable
```

Going back to the previous version of your database super easy.

```
$ cotton migration:down

Reverting: 20200717134438_CreateUserTable
Reverted:  20200717134438_CreateUserTable
```

By default, this will revert the last migration "batch", which can be consists of multiple migrations. However, you can specify how many migrations you want to revert by passing the `--steps` option.

```
$ cotton migration:down --steps 1
```

## Migration info

You can see all of your available migrations via `migration:info` command. This will print out every single migrations and check whether it's already applied to the database or not.

```
Applied  Migration
-------  ------------------------------
Yes      20200717134438_CreateUserTable
```
