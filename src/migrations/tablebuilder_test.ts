import { TableBuilder } from "./tablebuilder.ts";
import { testDB } from "../testutils.ts";
import { assertEquals } from "../../testdeps.ts";

testDB("TableBuilder", (client) => {
  const builder = new TableBuilder("posts", client);

  builder.addColumn({
    type: "increments",
    name: "id",
    primaryKey: true,
    autoIncrement: true,
  });
  builder.addColumn({ type: "varchar", name: "name" });

  const query = builder.toSQL();

  switch (client.type) {
    case "mysql":
      assertEquals(
        query,
        "create table users (id integer primary key auto_increment, name varchar(2048));",
      );
      break;
    case "sqlite":
      assertEquals(
        query,
        "create table users (id integer primary key autoincrement, name varchar(2048));",
      );
      break;
    case "postgres":
      assertEquals(
        query,
        "create table users (id serial primary key, name varchar(2048));",
      );
      break;
  }
});
