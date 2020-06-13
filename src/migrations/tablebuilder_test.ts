import { TableBuilder } from "./tablebuilder.ts";
import { testDB } from "../testutils.ts";
import { assertEquals } from "../../testdeps.ts";

testDB("TableBuilder", async (client) => {
  const builder = new TableBuilder("posts", client);

  builder.addColumn({
    type: "increments",
    name: "id",
    primaryKey: true,
    autoIncrement: true,
  });
  builder.addColumn({ type: "varchar", name: "name" });

  const query = builder.toSQL();

  console.log(query);

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
