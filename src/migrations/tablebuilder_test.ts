import { TableBuilder } from "./tablebuilder.ts";
import { testDB } from "../testutils.ts";
import { assertEquals } from "../../testdeps.ts";

testDB("TableBuilder", async (client) => {
  const query = new TableBuilder("posts", client)
    .addColumn({
      type: "increments",
      name: "id",
      primaryKey: true,
      autoIncrement: true,
    })
    .addColumn({ type: "varchar", name: "name" })
    .toSQL();

  switch (client.type) {
    case "mysql":
      assertEquals(
        query,
        "create table posts (id integer primary key auto_increment, name varchar(2048));",
      );
      break;
    case "sqlite":
      assertEquals(
        query,
        "create table posts (id integer primary key autoincrement, name varchar(2048));",
      );
      break;
    case "postgres":
      assertEquals(
        query,
        "create table posts (id serial primary key, name varchar(2048));",
      );
      break;
  }
});
