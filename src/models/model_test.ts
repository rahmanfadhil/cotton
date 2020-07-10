import { testDB } from "../testutils.ts";
import { Model } from "./model.ts";
import { Field } from "./fields.ts";
import {
  assertEquals,
  assertThrowsAsync,
  assertThrows,
} from "../../testdeps.ts";
import { formatDate } from "../utils/date.ts";

// --------------------------------------------------------------------------------
// UNIT TESTS
// --------------------------------------------------------------------------------

Deno.test("Model: values() -> default value", () => {
  class User extends Model {
    @Field({ default: "john" })
    name!: string;
  }

  const user = new User();
  assertEquals(user.values(), { name: "john" });
});

Deno.test("Model: values() -> nullable", () => {
  class User extends Model {
    @Field({ nullable: true })
    name!: string;
  }

  const user = new User();
  assertEquals(user.values(), { name: null });
});

Deno.test("Model: values() -> nullable error", () => {
  class User extends Model {
    @Field()
    name!: string;
  }

  const user = new User();
  assertThrows(() => user.values(), Error, "Field 'name' cannot be empty!");
});

Deno.test("Model: values() -> property different than name", () => {
  class User extends Model {
    @Field({ name: "full_name" })
    name!: string;
  }

  const user = new User();
  user.name = "john";
  assertEquals(user.values(), { full_name: "john" });
});

// --------------------------------------------------------------------------------
// INTEGRATION TESTS
// --------------------------------------------------------------------------------

class User extends Model {
  static tableName = "users";

  @Field()
  email!: string;

  @Field()
  age!: number;

  @Field()
  created_at!: Date;
}

class Product extends Model {
  static tableName = "products";

  @Field()
  name!: string;
}

testDB("Model: find()", async (client) => {
  const date = new Date("5 June, 2020");
  const formattedDate = formatDate(date);

  await client.query(
    `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${formattedDate}')`,
  );

  client.addModel(User);

  const users = await User.find();
  assertEquals(Array.isArray(users), true);
  assertEquals(users.length, 1);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, "a@b.com");
  assertEquals(users[0].age, 16);
  assertEquals(users[0].created_at, date);
});

testDB("Model: find() -> with options", async (client) => {
  await client.query(`INSERT INTO products (name) VALUES ('Cheese')`);
  await client.query(`INSERT INTO products (name) VALUES ('Spoon')`);
  await client.query(`INSERT INTO products (name) VALUES ('Spoon')`);
  await client.query(`INSERT INTO products (name) VALUES ('Spoon')`);
  await client.query(`INSERT INTO products (name) VALUES ('Table')`);

  client.addModel(Product);

  let products = await Product.find({ where: { name: "Spoon" } });
  assertEquals(products.length, 3);

  products = await Product.find({ limit: 2 });
  assertEquals(products.length, 2);

  products = await Product.find({ limit: 2, offset: 2 });
  assertEquals(products.length, 2);
  assertEquals(products[0].id, 3);
  assertEquals(products[1].id, 4);

  products = await Product.find(
    { where: { name: "Spoon" }, limit: 1, offset: 1 },
  );
  assertEquals(products.length, 1);
  assertEquals(products[0].id, 3);
});

testDB("Model: findOne()", async (client) => {
  const date = new Date("5 June, 2020");
  const formattedDate = formatDate(date);

  await client.query(
    `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${formattedDate}')`,
  );
  await client.query(
    `INSERT INTO users (email, age, created_at) VALUES ('b@c.com', 16, '${formattedDate}')`,
  );
  await client.query(
    `INSERT INTO users (email, age, created_at) VALUES ('c@d.com', 16, '${formattedDate}')`,
  );

  client.addModel(User);

  // Find by id
  let user = await User.findOne(2);
  assertEquals(user instanceof User, true);
  assertEquals(user?.id, 2);
  assertEquals(user?.email, "b@c.com");
  assertEquals(user?.created_at, date);
  assertEquals(user?.age, 16);

  // Find by columns
  user = await User.findOne({ email: "c@d.com" });
  assertEquals(user instanceof User, true);
  assertEquals(user?.id, 3);
  assertEquals(user?.email, "c@d.com");
  assertEquals(user?.created_at, date);
  assertEquals(user?.age, 16);
});

testDB("Model: save()", async (client) => {
  const date = new Date("5 June, 2020");

  client.addModel(User);

  let users = await User.find();
  assertEquals(users.length, 0);

  let user = new User();
  user.email = "a@b.com";
  user.age = 16;
  user.created_at = date;
  await user.save();

  assertEquals(user.id, 1);
  assertEquals(user.email, "a@b.com");
  assertEquals(user.age, 16);
  assertEquals(user.created_at, date);

  users = await User.find();
  assertEquals(users.length, 1);
  assertEquals(users[0] instanceof User, true);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, "a@b.com");
  assertEquals(users[0].age, 16);
  assertEquals(users[0].created_at, date);

  user.email = "b@c.com";
  await user.save();

  user = await User.findOne(1) as User;
  assertEquals(user.email, "b@c.com");
});

testDB("Model: insert() -> single", async (client) => {
  const date = new Date("5 June, 2020");

  client.addModel(User);

  let users = await User.find();
  assertEquals(users.length, 0);

  const user = await User.insert({
    email: "a@b.com",
    age: 16,
    created_at: date,
  });
  assertEquals(user instanceof User, true);
  assertEquals(user.id, 1);
  assertEquals(user.email, "a@b.com");
  assertEquals(user.age, 16);
  assertEquals(user.created_at, date);

  users = await User.find();
  assertEquals(users.length, 1);
  assertEquals(users[0] instanceof User, true);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].email, "a@b.com");
  assertEquals(users[0].age, 16);
  assertEquals(users[0].created_at, date);
});

testDB("Model: insert() -> multiple", async (client) => {
  const date = new Date("5 June, 2020");

  client.addModel(User);

  assertEquals((await User.find()).length, 0);

  let users = await User.insert([
    { email: "a@b.com", age: 16, created_at: date },
    { email: "a@b.com", created_at: date },
    { email: "a@b.com", age: 16 },
  ]);
  users.forEach((user, index) => {
    assertEquals(user.id, index + 1);
    assertEquals(user instanceof User, true);
  });

  users = await User.find();
  assertEquals(users.length, 3);
  users.forEach((user, index) => {
    assertEquals(user.id, index + 1);
    assertEquals(user instanceof User, true);
  });
});

testDB("Model: truncate()", async (client) => {
  const date = new Date("5 June, 2020");
  const formattedDate = formatDate(date);

  await client.query(
    `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${formattedDate}')`,
  );
  await client.query(
    `INSERT INTO users (email, age, created_at) VALUES ('b@c.com', 16, '${formattedDate}')`,
  );

  client.addModel(User);

  await User.truncate();

  const users = await User.find();
  assertEquals(users.length, 0);
});

testDB("Model: remove()", async (client) => {
  client.addModel(User);

  const user = await User.insert({
    email: "a@b.com",
    created_at: new Date("5 June, 2020"),
    age: 16,
  });
  await user.remove();

  assertEquals(await User.findOne(1), null);
});

testDB("Model: isSaved()", async (client) => {
  client.addModel(User);

  let user = await User.insert({
    email: "a@b.com",
    created_at: new Date("5 June, 2020"),
    age: 16,
  });

  assertEquals(user.isSaved(), true);

  user = new User();
  user.email = "a@b.com";
  user.created_at = new Date("5 June, 2020");
  user.age = 16;

  assertEquals(user.isSaved(), false);

  await user.save();

  assertEquals(user.isSaved(), true);
});

testDB("Model: isDirty()", async (client) => {
  client.addModel(User);

  let user = await User.insert({
    email: "a@b.com",
    created_at: new Date("5 June, 2020"),
    age: 16,
  });

  assertEquals(user.isDirty(), false);

  user = await User.findOne(1) as User;

  assertEquals(user.isDirty(), false);

  user.email = "c@d.com";

  assertEquals(user.isDirty(), true);

  user = new User();
  user.email = "a@b.com";
  user.created_at = new Date("5 June, 2020");
  user.age = 16;

  assertEquals(user.isDirty(), true);

  await user.save();

  assertEquals(user.isDirty(), false);

  user.email = "c@d.com";

  assertEquals(user.isDirty(), true);
});

testDB("Model: delete()", async (client) => {
  client.addModel(User);

  const formattedDate = formatDate(new Date());
  await client.query(
    `INSERT INTO users (id, email, age, created_at) VALUES
      (1, 'a@b.com', 16, '${formattedDate}'),
      (2, 'b@c.com', 16, '${formattedDate}'),
      (3, 'c@d.com', 18, '${formattedDate}');`,
  );

  await User.delete({ where: { age: 16 } });

  const users = await client.query<{ age: number }>("SELECT * FROM users;");
  assertEquals(users.length, 1);
  assertEquals(users[0].age, 18);

  await assertThrowsAsync(
    async () => {
      await User.delete({});
    },
    Error,
    "Cannot perform delete without where clause, use `truncate` to delete all records!",
  );
});

testDB("Model: deleteOne()", async (client) => {
  client.addModel(User);

  const formattedDate = formatDate(new Date());
  await client.query(
    `INSERT INTO users (id, email, age, created_at) VALUES
      (1, 'a@b.com', 16, '${formattedDate}'),
      (2, 'b@c.com', 16, '${formattedDate}'),
      (3, 'c@d.com', 18, '${formattedDate}');`,
  );

  await User.deleteOne(1);

  let result = await client.query<{ email: string; id: number }>(
    "SELECT * FROM users",
  );
  assertEquals(result.length, 2);
  assertEquals(result[0].email, "b@c.com");
  assertEquals(result[0].id, 2);
  assertEquals(result[1].email, "c@d.com");
  assertEquals(result[1].id, 3);

  await User.deleteOne(2);

  result = await client.query<{ email: string; id: number }>(
    "SELECT * FROM users",
  );
  assertEquals(result.length, 1);
  assertEquals(result[0].email, "c@d.com");
  assertEquals(result[0].id, 3);
});
