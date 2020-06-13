import { testDB } from "../testutils.ts";
import { Migration } from "./migration.ts";
import { assertEquals } from "../../testdeps.ts";

testDB("Migration: getTableInfo", async (client) => {
  const migration = new Migration(client);

  // Table exists
  assertEquals(await migration.getTableInfo("users").exists(), true);

  // Table not exists
  assertEquals(await migration.getTableInfo("posts").exists(), false);
});

testDB("Migration: createTable and dropTable", async (client) => {
  const migration = new Migration(client);
  const tableInfo = migration.getTableInfo("posts");

  // Table not exists at first
  assertEquals(await tableInfo.exists(), false);

  // Create table
  await migration.createTable("posts")
    .addColumn({
      type: "increments",
      name: "id",
      primaryKey: true,
      autoIncrement: true,
    })
    .addColumn({ type: "varchar", name: "name" })
    .execute();

  // The table now should be exists
  assertEquals(await tableInfo.exists(), true);

  // Drop table
  await migration.dropTable("posts");

  // The table should be dropped
  assertEquals(await tableInfo.exists(), false);
});
