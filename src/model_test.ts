import { testDB } from "./testutils.ts";
import { Model, FieldType } from "./model.ts";
import { assertEquals } from "../testdeps.ts";
import { DateUtils } from "./utils/date.ts";

class User extends Model {
  static tableName = "users";
  static fields = {
    email: { type: FieldType.STRING },
    age: { type: FieldType.NUMBER },
    created_at: { type: FieldType.DATE },
  };

  email!: string;
  age!: number;
  created_at!: Date;
}

class Product extends Model {
  static tableName = "products";
  static fields = {
    name: { type: FieldType.STRING },
  };

  name!: string;
}

testDB("Model: find", async (client) => {
  const date = new Date("5 June, 2020");
  const formattedDate = DateUtils.formatDate(date);

  await client.execute(
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

testDB("Model: find with options", async (client) => {
  await client.execute(`INSERT INTO products (name) VALUES ('Cheese')`);
  await client.execute(`INSERT INTO products (name) VALUES ('Spoon')`);
  await client.execute(`INSERT INTO products (name) VALUES ('Spoon')`);
  await client.execute(`INSERT INTO products (name) VALUES ('Spoon')`);
  await client.execute(`INSERT INTO products (name) VALUES ('Table')`);

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

testDB("Model: findOne", async (client) => {
  const date = new Date("5 June, 2020");
  const formattedDate = DateUtils.formatDate(date);

  await client.execute(
    `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${formattedDate}')`,
  );
  await client.execute(
    `INSERT INTO users (email, age, created_at) VALUES ('b@c.com', 16, '${formattedDate}')`,
  );
  await client.execute(
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

testDB("Model: save", async (client) => {
  const date = new Date("5 June, 2020");

  client.addModel(User);

  let users = await User.find();
  assertEquals(users.length, 0);

  const user = new User();
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
});

testDB("Model: insert", async (client) => {
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

testDB("Model: truncate", async (client) => {
  const date = new Date("5 June, 2020");
  const formattedDate = DateUtils.formatDate(date);

  await client.execute(
    `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${formattedDate}')`,
  );
  await client.execute(
    `INSERT INTO users (email, age, created_at) VALUES ('b@c.com', 16, '${formattedDate}')`,
  );

  client.addModel(User);

  await User.truncate();

  const users = await User.find();
  assertEquals(users.length, 0);
});

testDB("Model: remove", async (client) => {
  client.addModel(User);

  const user = await User.insert({
    email: "a@b.com",
    created_at: new Date("5 June, 2020"),
    age: 16,
  });
  await user.remove();

  assertEquals(await User.findOne(1), null);
});

testDB("Model: isSaved", async (client) => {
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

testDB("Model: isDirty", async (client) => {
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

  console.log(user);

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
