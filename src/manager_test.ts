import { Model } from "./model.ts";
import { assertEquals } from "../testdeps.ts";
import { testDB } from "./testutils.ts";

class User extends Model {
  static tableName = "users";

  public id: number;
  public email: string;
}

testDB("Manager: `find` should return an array of records", async (db) => {
  await db.execute(`
    create table if not exists users (
      id integer primary key autoincrement,
      email varchar(255)
    );
  `);

  await db.execute(`insert into users (email) values ('a@b.com');`);

  // Check if returns an array of users
  const users = await db.manager.find(User);
  assertEquals(Array.isArray(users), true);
  assertEquals(users.length, 1);

  // Check individual users
  const user: User = users[0];
  assertEquals(user instanceof User, true);
  assertEquals(user.email, "a@b.com");
  assertEquals(user.id, 1);
});
