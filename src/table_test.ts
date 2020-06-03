import { Table } from "./table.ts";
import { assertEquals } from "../testdeps.ts";

Deno.test("Table: mysql", () => {
  const table = new Table("users", [
    { type: "increments", name: "id", primaryKey: true, autoIncrement: true },
    { type: "varchar", name: "name" },
  ], { dialect: "mysql" });

  assertEquals(
    table.toSQL(),
    "create table users (id int primary key auto_increment, name varchar);",
  );
});

Deno.test("Table: sqlite", () => {
  const table = new Table("users", [
    { type: "increments", name: "id", primaryKey: true, autoIncrement: true },
    { type: "varchar", name: "name" },
  ], { dialect: "sqlite" });

  assertEquals(
    table.toSQL(),
    "create table users (id int primary key autoincrement, name varchar);",
  );
});

Deno.test("Table: postgres", () => {
  const table = new Table("users", [
    { type: "increments", name: "id", primaryKey: true, autoIncrement: true },
    { type: "varchar", name: "name" },
  ], { dialect: "postgres" });

  assertEquals(
    table.toSQL(),
    "create table users (id serial primary key, name varchar);",
  );
});
