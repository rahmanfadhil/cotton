import { testDB } from "./testutils.ts";
import { Model } from "./model.ts";
import { assertEquals } from "../testdeps.ts";

testDB("Model: find", async (client) => {
  class User extends Model {
    static tableName = "users";
    static fields = {
      email: String,
    };

    id: number;
    email: string;
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255)
    );
  `);
  await client.execute("INSERT INTO users (email) VALUES ('a@b.com')");

  client.addModel(User);

  const users = await User.find();
  assertEquals(Array.isArray(users), true);
  assertEquals(users.length, 1);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, "a@b.com");
});

testDB("Model: findOne", async (client) => {
  class User extends Model {
    static tableName = "users";
    static fields = {
      email: String,
    };

    id: number;
    email: string;
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255)
    );
  `);
  await client.execute("INSERT INTO users (email) VALUES ('a@b.com')");

  client.addModel(User);

  const user = await User.findOne(1);
  assertEquals(user instanceof User, true);
  console.log(user);
  // assertEquals(user?.id, 1);
  // assertEquals(user?.email, "a@b.com");
});
