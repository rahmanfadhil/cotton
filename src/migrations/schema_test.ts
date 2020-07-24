import { testDB } from "../testutils.ts";
import { Schema } from "./schema.ts";
import { assertEquals, assertThrowsAsync } from "../../testdeps.ts";
import { ColumnBuilder } from "./columnbuilder.ts";

testDB("Schema: hasTable", async (client) => {
  const schema = new Schema(client);

  // Table exists
  assertEquals(await schema.hasTable("users"), true);

  // Table not exists
  assertEquals(await schema.hasTable("posts"), false);
});

testDB("Schema: renameTable", async (client) => {
  const schema = new Schema(client);

  assertEquals(await schema.hasTable("users"), true);
  assertEquals(await schema.hasTable("accounts"), false);

  await schema.renameTable("users", "accounts");

  assertEquals(await schema.hasTable("users"), false);
  assertEquals(await schema.hasTable("accounts"), true);

  await schema.renameTable("accounts", "users");

  assertEquals(await schema.hasTable("users"), true);
  assertEquals(await schema.hasTable("accounts"), false);
});

testDB("Schema: createTable and dropTable", async (client) => {
  const schema = new Schema(client);

  // Table not exists at first
  assertEquals(await schema.hasTable("posts"), false);

  // Create table
  await schema.createTable("posts", (table) => {
    table.id();
    table.varchar("title", 100);
    table.varchar("description");
    table.text("content");
    table.integer("likes");
    table.bigInteger("price");
    table.boolean("is_published");
    table.datetime("published_at");
    table.timestamps();
  });

  // The table now should be exists
  assertEquals(await schema.hasTable("posts"), true);

  // Drop table
  await schema.dropTable("posts");

  // The table should be dropped
  assertEquals(await schema.hasTable("posts"), false);
});

testDB("Schema: dropTable", async (client) => {
  const schema = new Schema(client);

  // Create tables
  await client.query(`CREATE TABLE posts (id INTEGER PRIMARY KEY);`);
  await client.query(`CREATE TABLE articles (id INTEGER PRIMARY KEY);`);
  await client.query(`CREATE TABLE chats (id INTEGER PRIMARY KEY);`);
  await client.query(`CREATE TABLE votes (id INTEGER PRIMARY KEY);`);

  await schema.dropTable("posts");
  assertEquals(await schema.hasTable("posts"), false);

  await schema.dropTable(["articles", "chats", "votes"]);
  assertEquals(await schema.hasTable("articles"), false);
  assertEquals(await schema.hasTable("chats"), false);
  assertEquals(await schema.hasTable("votes"), false);

  await assertThrowsAsync(async () => {
    await schema.dropTable("posts");
  });

  await assertThrowsAsync(async () => {
    await schema.dropTable(["articles", "chats", "votes"]);
  });

  // await schema.dropTable("posts", { ifExists: true });
  // await schema.dropTable(["articles", "chats", "votes"], { ifExists: true });
});

testDB("Schema: hasColumn, addColumn, and dropColumn", async (client) => {
  const schema = new Schema(client);

  assertEquals(await schema.hasColumn("users", "id"), true);
  assertEquals(await schema.hasColumn("users", "name"), false);

  const column = new ColumnBuilder("name", "varchar", 255);
  await schema.addColumn("users", column);

  assertEquals(await schema.hasColumn("users", "name"), true);

  if (client.dialect !== "sqlite") {
    await schema.dropColumn("users", "name");
    assertEquals(await schema.hasColumn("users", "name"), false);
  } else {
    await assertThrowsAsync(
      async () => {
        await schema.dropColumn("users", "name");
      },
      Error,
      "SQLite doesn't support DROP COLUMN at the moment!",
    );
  }
});

testDB("Schema: query", () => {
});
