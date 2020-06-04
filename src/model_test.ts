import { testDB } from "./testutils.ts";
import { Model } from "./model.ts";
import { assertEquals } from "../testdeps.ts";

class User extends Model {
  static tableName = "users";
  static fields = {
    email: String,
  };

  email!: string;
}

testDB("Model: find", async (client) => {
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
  assertEquals(user?.id, 1);
  assertEquals(user?.email, "a@b.com");
});

testDB("Model: save", async (client) => {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255)
    );
  `);

  client.addModel(User);

  let users = await User.find();
  assertEquals(users.length, 0);

  const user = new User();
  user.email = "a@b.com";
  await user.save();

  users = await User.find();
  assertEquals(users.length, 1);
  assertEquals(users[0] instanceof User, true);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, "a@b.com");
});

testDB("Model: insert", async (client) => {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255)
    );
  `);

  client.addModel(User);

  let users = await User.find();
  assertEquals(users.length, 0);

  const user = await User.insert({ email: "a@b.com" });
  assertEquals(user instanceof User, true);

  users = await User.find();
  assertEquals(users.length, 1);
  assertEquals(users[0] instanceof User, true);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, "a@b.com");
});
