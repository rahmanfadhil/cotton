import { testDB } from "../testutils.ts";
import { Schema } from "./schema.ts";
import { assertEquals, assertThrows } from "../../testdeps.ts";

testDB("Schema: getTableInfo", async (client) => {
  const schema = new Schema(client);

  // Table exists
  assertEquals(await schema.getTableInfo("users").exists(), true);

  // Table not exists
  assertEquals(await schema.getTableInfo("posts").exists(), false);
});

testDB("Schema: renameTable", async (client) => {
  const schema = new Schema(client);

  assertEquals(await schema.getTableInfo("users").exists(), true);
  assertEquals(await schema.getTableInfo("accounts").exists(), false);

  await schema.renameTable("users", "accounts");

  assertEquals(await schema.getTableInfo("users").exists(), false);
  assertEquals(await schema.getTableInfo("accounts").exists(), true);

  await schema.renameTable("accounts", "users");

  assertEquals(await schema.getTableInfo("users").exists(), true);
  assertEquals(await schema.getTableInfo("accounts").exists(), false);
});

testDB("Schema: createTable and dropTable", async (client) => {
  const schema = new Schema(client);
  const tableInfo = schema.getTableInfo("posts");

  // Table not exists at first
  assertEquals(await tableInfo.exists(), false);

  // Create table
  await schema.createTable("posts", (table) => {
    table.id();
    table.string("title", 100);
    table.string("description");
    table.text("content");
    table.integer("likes");
    table.bigInteger("price");
    table.boolean("is_published");
    table.datetime("published_at");
    table.timestamps();
  });

  // The table now should be exists
  assertEquals(await tableInfo.exists(), true);

  // Drop table
  await schema.dropTable("posts");

  // The table should be dropped
  assertEquals(await tableInfo.exists(), false);
});

testDB("Schema: dropTable and dropTables", async (client) => {
  const schema = new Schema(client);

  // Create tables
  await schema.createTable("posts", (table) => table.id());
  await schema.createTable("articles", (table) => table.id());
  await schema.createTable("chats", (table) => table.id());
  await schema.createTable("votes", (table) => table.id());

  await schema.dropTable("posts");
  assertEquals(await schema.getTableInfo("posts").exists(), false);

  await schema.dropTables(["articles", "chats", "votes"]);
  assertEquals(await schema.getTableInfo("articles").exists(), false);
  assertEquals(await schema.getTableInfo("chats").exists(), false);
  assertEquals(await schema.getTableInfo("votes").exists(), false);
});
