import { testDB } from "./testutils.ts";
import {
  Model,
  Column,
  Primary,
  Relation,
  RelationType,
} from "./model.ts";
import { Manager } from "./manager.ts";
import { assert, assertEquals, assertThrowsAsync } from "../testdeps.ts";
import { formatDate } from "./utils/date.ts";

@Model("users")
class User {
  @Primary()
  id!: number;

  @Column({ name: "first_name", isNullable: false })
  firstName!: string;

  @Column({ name: "last_name", isNullable: false })
  lastName!: string;

  @Column()
  age!: number;

  @Column({ name: "created_at", default: () => new Date() })
  createdAt!: Date;

  @Column({ name: "is_active", default: false })
  isActive!: boolean;

  @Relation(RelationType.HasMany, () => Product, "user_id")
  products!: Product[];
}

@Model("products")
class Product {
  @Primary()
  id!: number;

  @Column({ isNullable: false })
  title!: string;

  @Relation(RelationType.BelongsTo, () => User, "user_id")
  user!: User;
}

testDB(
  "Manager.save() -> should save a new record to the database and update it if something changed",
  async (client) => {
    let result = await client.query("SELECT id FROM users;");
    assertEquals(result.length, 0);

    const manager = new Manager(client);
    const user = new User();
    user.firstName = "John";
    user.lastName = "Doe";
    user.age = 16;
    await manager.save(user);

    assertEquals(user.isActive, false);
    assert(user.createdAt instanceof Date);

    result = await client.query("SELECT id, first_name FROM users;");
    assertEquals(result.length, 1);
    assertEquals(result[0].id, user.id);
    assertEquals(result[0].first_name, "John");

    user.firstName = "Jane";
    await manager.save(user);

    result = await client.query("SELECT id, first_name FROM users;");
    assertEquals(result.length, 1);
    assertEquals(result[0].id, user.id);
    assertEquals(result[0].first_name, "Jane");
  },
);

testDB(
  "Manager.save() -> throw an error if the object is not a validmodel",
  async (client) => {
    const manager = new Manager(client);
    class Article {}
    const article = new Article();
    await assertThrowsAsync(
      async () => {
        await manager.save(article);
      },
      Error,
      "Class 'Article' must be wrapped with @Model decorator!",
    );
  },
);

testDB(
  "Manager.save() -> should save belongs to relations",
  async (client) => {
    const manager = new Manager(client);

    const user = new User();
    user.firstName = "John";
    user.lastName = "Doe";
    user.age = 16;
    await manager.save(user);

    const product = new Product();
    product.title = "Spoon";
    product.user = user;
    await manager.save(product);

    const users = await client.query("SELECT id, first_name FROM users");
    assertEquals(users.length, 1);
    assertEquals(users[0].id, user.id);
    assertEquals(users[0].first_name, user.firstName);

    const products = await client.query(
      "SELECT id, user_id, title FROM products",
    );
    assertEquals(products.length, 1);
    assertEquals(products[0].id, product.id);
    assertEquals(products[0].user_id, product.user.id);
    assertEquals(products[0].title, product.title);
  },
);

testDB(
  "Manager.save() -> should save has many relations",
  async (client) => {
    const manager = new Manager(client);

    const product1 = new Product();
    product1.title = "Spoon";
    await manager.save(product1);

    const product2 = new Product();
    product2.title = "Table";
    await manager.save(product2);

    console.log(product1);
    console.log(product2);

    const user = new User();
    user.firstName = "John";
    user.lastName = "Doe";
    user.age = 16;
    user.products = [product1, product2];
    await manager.save(user);

    const users = await client.query("SELECT id, first_name FROM users");
    assertEquals(users.length, 1);
    assertEquals(users[0].id, user.id);
    assertEquals(users[0].first_name, user.firstName);

    const products = await client.query(
      "SELECT id, user_id, title FROM products",
    );
    assertEquals(products.length, 2);
    assertEquals(products[0].id, product1.id);
    assertEquals(products[1].id, product2.id);
    for (let i = 0; i < products.length; i++) {
      assertEquals(products[i].user_id, user.id);
    }
  },
);

testDB("Manager.find() -> should return all records", async (client) => {
  const manager = new Manager(client);
  let users = await manager.find(User);
  assert(Array.isArray(users));
  assertEquals(users.length, 0);

  const data = {
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
  };
  await client.table("users").insert(data).execute();

  users = await manager.find(User);
  assert(Array.isArray(users));
  assertEquals(users.length, 1);
  assert(users[0] instanceof User);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].firstName, data.first_name);
  assertEquals(users[0].lastName, data.last_name);
  assertEquals(users[0].age, data.age);
  assertEquals(users[0].isActive, data.is_active);
  assertEquals(users[0].createdAt, data.created_at);
});

testDB("Manager.find() -> should query with options", async (client) => {
  const data = [{
    id: 1,
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
  }, {
    id: 2,
    first_name: "Jane",
    last_name: "Doe",
    age: 17,
    created_at: new Date(),
    is_active: true,
  }, {
    id: 3,
    first_name: "Tom",
    last_name: "Cruise",
    age: 18,
    created_at: new Date(),
    is_active: true,
  }];
  await client.table("users").insert(data).execute();

  const manager = new Manager(client);

  let users = await manager.find(User, { where: { lastName: "Doe" } });
  assertEquals(users.length, 2);
  assert(users[0] instanceof User);
  assert(users[1] instanceof User);
  assertEquals(users[0].id, 1);
  assertEquals(users[1].id, 2);

  users = await manager.find(User, { where: { isActive: true } });
  assertEquals(users.length, 2);
  assert(users[0] instanceof User);
  assert(users[1] instanceof User);
  assertEquals(users[0].id, 2);
  assertEquals(users[1].id, 3);

  users = await manager.find(User, {
    where: { lastName: "Doe", isActive: true },
  });
  assertEquals(users.length, 1);
  assert(users[0] instanceof User);
  assertEquals(users[0].id, 2);
});

testDB(
  "Manager.find() -> should have no relation properties by default",
  async (client) => {
    await client.table("users").insert({
      first_name: "John",
      last_name: "Doe",
      age: 16,
      created_at: new Date(),
      is_active: false,
    }).execute();

    await client.table("products").insert({
      title: "Spoon",
      user_id: 1,
    }).execute();

    const manager = new Manager(client);

    const users = await manager.find(User);
    assertEquals(users[0].products, undefined);

    const products = await manager.find(Product);
    assertEquals(products[0].user, undefined);
  },
);

testDB("Manager.find() -> should fetch the relations", async (client) => {
  await client.table("users").insert([{
    id: 1,
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
  }, {
    id: 2,
    first_name: "Jane",
    last_name: "Doe",
    age: 17,
    created_at: new Date(),
    is_active: false,
  }]).execute();

  await client.table("products").insert([
    { id: 1, title: "Spoon", user_id: 1 },
    { id: 2, title: "Table", user_id: 1 },
  ]).execute();

  const manager = new Manager(client);

  const users = await manager.find(User, { includes: ["products"] });
  assertEquals(users.length, 2);

  assert(Array.isArray(users[0].products));
  assertEquals(users[0].products.length, 2);
  assert(users[0].products[0] instanceof Product);
  assertEquals(users[0].products[0].title, "Spoon");
  assert(users[0].products[1] instanceof Product);
  assertEquals(users[0].products[1].title, "Table");

  assertEquals(users[1].products, []);

  const products = await manager.find(Product, { includes: ["user"] });
  assertEquals(products.length, 2);
  for (let i = 0; i < products.length; i++) {
    assert(products[i].user instanceof User);
    assertEquals(products[i].user.id, 1);
    assertEquals(products[i].user.firstName, "John");
  }
});

testDB("Manager.findOne() -> should return a single record", async (client) => {
  const manager = new Manager(client);
  let user = await manager.findOne(User);
  assertEquals(user, null);

  const data = {
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
  };
  await client.table("users").insert(data).execute();

  user = await manager.findOne(User);
  assert(user instanceof User);
  assertEquals(user.id, 1);
  assertEquals(user.firstName, data.first_name);
  assertEquals(user.lastName, data.last_name);
  assertEquals(user.age, data.age);
  assertEquals(user.isActive, data.is_active);
  assertEquals(user.createdAt, data.created_at);
});

testDB("Manager.find() -> should query with options", async (client) => {
  const data = [{
    id: 1,
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
  }, {
    id: 2,
    first_name: "Jane",
    last_name: "Doe",
    age: 17,
    created_at: new Date(),
    is_active: true,
  }, {
    id: 3,
    first_name: "Tom",
    last_name: "Cruise",
    age: 18,
    created_at: new Date(),
    is_active: true,
  }];
  await client.table("users").insert(data).execute();

  const manager = new Manager(client);

  let user = await manager.findOne(User, { where: { lastName: "Doe" } });
  assert(user instanceof User);
  assertEquals(user.id, 1);

  user = await manager.findOne(User, { where: { isActive: true } });
  assert(user instanceof User);
  assertEquals(user.id, 2);

  user = await manager.findOne(User, { where: { id: 3 } });
  assert(user instanceof User);
  assertEquals(user.id, 3);
});

testDB(
  "Manager.findOne() -> should have no relation properties by default",
  async (client) => {
    await client.table("users").insert({
      first_name: "John",
      last_name: "Doe",
      age: 16,
      created_at: new Date(),
      is_active: false,
    }).execute();

    await client.table("products").insert({
      title: "Spoon",
      user_id: 1,
    }).execute();

    const manager = new Manager(client);

    const user = await manager.findOne(User);
    assertEquals(user!.products, undefined);

    const product = await manager.findOne(Product);
    assertEquals(product!.user, undefined);
  },
);

testDB("Manager.findOne() -> should fetch the relations", async (client) => {
  await client.table("users").insert([{
    id: 1,
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
  }, {
    id: 2,
    first_name: "Jane",
    last_name: "Doe",
    age: 17,
    created_at: new Date(),
    is_active: false,
  }]).execute();

  await client.table("products").insert([
    { id: 1, title: "Spoon", user_id: 1 },
    { id: 2, title: "Table", user_id: 1 },
  ]).execute();

  const manager = new Manager(client);

  const user = await manager.findOne(User, { includes: ["products"] });
  assert(Array.isArray(user!.products));
  assertEquals(user!.products.length, 2);
  assert(user!.products[0] instanceof Product);
  assertEquals(user!.products[0].title, "Spoon");
  assert(user!.products[1] instanceof Product);
  assertEquals(user!.products[1].title, "Table");

  const user1 = await manager.findOne(User, {
    where: { id: 1 },
    includes: ["products"],
  });
  assert(Array.isArray(user1!.products));
  assertEquals(user1!.products.length, 2);
  assert(user1!.products[0] instanceof Product);
  assertEquals(user1!.products[0].title, "Spoon");
  assert(user1!.products[1] instanceof Product);
  assertEquals(user1!.products[1].title, "Table");

  const product = await manager.findOne(Product, { includes: ["user"] });
  assert(product!.user instanceof User);
  assertEquals(product!.user.id, 1);
  assertEquals(product!.user.firstName, "John");
});

testDB(
  "Manager.remove() -> should remove a model from the database",
  async (client) => {
    await client.table("users").insert({
      first_name: "John",
      last_name: "Doe",
      age: 16,
      created_at: new Date(),
      is_active: false,
    }).execute();

    const manager = new Manager(client);
    const user = await manager.findOne(User);
    await manager.remove(user!);
    assertEquals(user!.id, undefined);

    assertEquals(await manager.findOne(User), null);
  },
);

testDB(
  "Manager.insert() -> should create a model instance and save it to the database",
  async (client) => {
    const manager = new Manager(client);

    let users = await client.query("SELECT id FROM users;");
    assertEquals(users.length, 0);

    const user = await manager.insert(User, {
      firstName: "John",
      lastName: "Doe",
      age: 16,
    });
    assert(user instanceof User);
    assertEquals(user.id, 1);
    assertEquals(user.firstName, "John");
    assertEquals(user.lastName, "Doe");
    assertEquals(user.age, 16);
    assertEquals(user.isActive, false);
    assert(user.createdAt instanceof Date);
    assertEquals(user.products, undefined);

    users = await client.query("SELECT * FROM users;");
    assertEquals(users.length, 1);
    assertEquals(users[0].id, user.id);
    assertEquals(users[0].first_name, user.firstName);
    assertEquals(users[0].last_name, user.lastName);
    assertEquals(users[0].age, user.age);
    assertEquals(users[0].is_active, client.dialect === "postgres" ? false : 0);
    assertEquals(
      users[0].created_at,
      client.dialect === "sqlite"
        ? formatDate(user.createdAt)
        : user.createdAt,
    );
  },
);

testDB(
  "Manager.insert() -> should create multiple model instances and save them to the database",
  async (client) => {
    const manager = new Manager(client);

    assertEquals((await client.query("SELECT id FROM users;")).length, 0);

    const users = await manager.insert(User, [{
      firstName: "John",
      lastName: "Doe",
      age: 16,
    }, {
      firstName: "Jane",
      lastName: "Doe",
      age: 17,
    }]);
    assert(Array.isArray(users));
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      assertEquals(user.id, i + 1);
      assertEquals(user.firstName, i ? "Jane" : "John");
      assertEquals(user.lastName, "Doe");
      assertEquals(user.age, i ? 17 : 16);
      assertEquals(user.isActive, false);
      assert(user.createdAt instanceof Date);
      assertEquals(user.products, undefined);
    }

    const result = await client.query("SELECT * FROM users;");
    assertEquals(result.length, 2);
    for (let i = 0; i < result.length; i++) {
      const data = result[i];
      assertEquals(data.id, users[i].id);
      assertEquals(data.first_name, users[i].firstName);
      assertEquals(data.last_name, users[i].lastName);
      assertEquals(data.age, users[i].age);
      assertEquals(data.is_active, client.dialect === "postgres" ? false : 0);
      assertEquals(
        data.created_at,
        client.dialect === "sqlite"
          ? formatDate(users[i].createdAt)
          : users[i].createdAt,
      );
    }
  },
);

testDB("Manager.find() -> pagination", async (client) => {
  await client.table("users").insert({ id: 1 }).execute();
  await client.table("products")
    .insert([
      { id: 1, title: "Post 1", user_id: 1 },
      { id: 2, title: "Post 2", user_id: 1 },
      { id: 3, title: "Post 3", user_id: 1 },
      { id: 4, title: "Post 4", user_id: 1 },
      { id: 5, title: "Post 5", user_id: 1 },
      { id: 6, title: "Post 6", user_id: 1 },
    ])
    .execute();

  const manager = new Manager(client);

  let products = await manager.find(Product, { limit: 3 });
  assertEquals(products.length, 3);

  for (let i = 0; i < products.length; i++) {
    assertEquals(products[i].id, i + 1);
  }

  products = await manager.find(Product, { limit: 3, offset: 3 });
  assertEquals(products.length, 3);
  for (let i = 0; i < products.length; i++) {
    assertEquals(products[i].id, i + 4);
  }
});
