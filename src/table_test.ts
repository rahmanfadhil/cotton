import { TableBuilder } from "./table.ts";
import { assertEquals } from "../testdeps.ts";
import { testDB } from "./testutils.ts";

Deno.test("Table: mysql", () => {
  const table = new TableBuilder("users", undefined, { dialect: "mysql" })
    .addField(
      { type: "increments", name: "id", primaryKey: true, autoIncrement: true },
    )
    .addField({ type: "varchar", name: "name" });

  assertEquals(
    table.toSQL(),
    "create table users (id integer primary key auto_increment, name varchar(2048));",
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
    "create table users (id integer primary key autoincrement, name varchar(2048));",
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
    "create table users (id serial primary key, name varchar(2048));",
  );
});

testDB("Table: create and check for existence", async (client) => {
  // Check if Table is already in Database if so Drop it
  let tablehandler = client.table("testing_table");
  if (
    await tablehandler.exists()
  ) {
    await tablehandler.delete();
  }

  // Check if table exists again it should be false
  assertEquals(
    await tablehandler.exists(),
    false,
  );

  // Now we create the table again
  await tablehandler
    .create()
    .addField(
      { type: "increments", name: "id", primaryKey: true, autoIncrement: true },
    )
    .addField({ type: "varchar", name: "name" })
    .execute();

  // Table should exist now
  assertEquals(
    await tablehandler
      .exists(),
    true,
  );
});
