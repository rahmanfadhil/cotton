import { TableBuilder } from "./table.ts";
import { assertEquals } from "../testdeps.ts";

Deno.test("Table: mysql", () => {
  const table = new TableBuilder("users", undefined, { dialect: "mysql" })
    .addField(
      { type: "increments", name: "id", primaryKey: true, autoIncrement: true },
    )
    .addField({ type: "varchar", name: "name" });

  assertEquals(
    table.toSQL(),
    "create table users (id int primary key auto_increment, name varchar);",
  );
});

Deno.test("Table: sqlite", () => {
  const table = new TableBuilder("users", undefined, { dialect: "sqlite" })
    .addField(
      { type: "increments", name: "id", primaryKey: true, autoIncrement: true },
    )
    .addField({ type: "varchar", name: "name" });

  assertEquals(
    table.toSQL(),
    "create table users (id int primary key autoincrement, name varchar);",
  );
});

Deno.test("Table: postgres", () => {
  const table = new TableBuilder("users", undefined, { dialect: "postgres" })
    .addField(
      { type: "increments", name: "id", primaryKey: true, autoIncrement: true },
    )
    .addField({ type: "varchar", name: "name" });

  assertEquals(
    table.toSQL(),
    "create table users (id serial primary key, name varchar);",
  );
});
