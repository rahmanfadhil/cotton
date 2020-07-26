import { testDB, User, Product } from "./testutils.ts";
import { Manager } from "./manager.ts";
import { assert, assertEquals, assertThrowsAsync } from "../testdeps.ts";
import { formatDate } from "./utils/date.ts";
import { ModelQuery } from "./modelquery.ts";

Deno.test("Manager.query() -> should return a ModelQuery", () => {
  const adapter = Symbol();
  const manager = new Manager(adapter as any);
  const query = manager.query(User);
  assert(query instanceof ModelQuery);
  assertEquals((query as any).adapter, adapter);
  assertEquals((query as any).modelClass, User);
});

testDB(
  "Manager.save() -> should save a new record to the database and update it if something changed",
  async (client) => {
    let result = await client.query("SELECT id FROM users;");
    assertEquals(result.length, 0);

    const manager = new Manager(client);
    const user = new User();
    user.email = "a@b.com";
    user.firstName = "John";
    user.lastName = "Doe";
    user.age = 16;
    user.password = "12345";
    await manager.save(user);

    assertEquals(user.isActive, false);
    assert(user.createdAt instanceof Date);

    result = await client.query(
      "SELECT id, email, first_name, password, is_active FROM users;",
    );
    assertEquals(result.length, 1);
    assertEquals(result[0].id, user.id);
    assertEquals(result[0].email, user.email);
    assertEquals(result[0].first_name, user.firstName);
    assertEquals(result[0].password, user.password);
    assertEquals(
      result[0].is_active,
      client.dialect === "postgres" ? false : 0,
    );

    user.email = "a@b.com";
    user.isActive = true;
    await manager.save(user);

    result = await client.query("SELECT id, email, is_active FROM users;");
    assertEquals(result.length, 1);
    assertEquals(result[0].id, user.id);
    assertEquals(result[0].email, user.email);
    assertEquals(result[0].is_active, client.dialect === "postgres" ? true : 1);
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

    const users = await client.query(
      "SELECT id, first_name FROM users",
    );
    assertEquals(users.length, 1);
    assertEquals(users[0].id, user.id);
    assertEquals(users[0].first_name, user.firstName);

    const products = await client.query(
      "SELECT product_id, user_id, title FROM product",
    );
    assertEquals(products.length, 1);
    assertEquals(products[0].product_id, product.productId);
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

    const user = new User();
    user.email = "a@b.com";
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
      "SELECT product_id, user_id, title FROM product",
    );
    assertEquals(products.length, 2);
    assertEquals(products[0].product_id, product1.productId);
    assertEquals(products[1].product_id, product2.productId);
    for (let i = 0; i < products.length; i++) {
      assertEquals(products[i].user_id, user.id);
    }
  },
);

testDB(
  "Manager.remove() -> should remove a model from the database",
  async (client) => {
    await client.table("users").insert({
      email: "a@b.com",
      first_name: "John",
      last_name: "Doe",
      age: 16,
      created_at: new Date(),
      is_active: false,
    }).execute();

    const manager = new Manager(client);
    const user = await manager.query(User).first();
    await manager.remove(user!);
    assertEquals(user!.id, undefined);

    assertEquals(await manager.query(User).first(), null);
  },
);

testDB(
  "Manager.insert() -> should create a model instance and save it to the database",
  async (client) => {
    const manager = new Manager(client);

    let users = await client.query("SELECT id FROM users;");
    assertEquals(users.length, 0);

    const user = await manager.insert(User, {
      email: "a@b.com",
      firstName: "John",
      lastName: "Doe",
      age: 16,
      password: "12345",
    });
    assert(user instanceof User);
    assertEquals(user.id, 1);
    assertEquals(user.email, "a@b.com");
    assertEquals(user.firstName, "John");
    assertEquals(user.lastName, "Doe");
    assertEquals(user.age, 16);
    assertEquals(user.password, "12345");
    assertEquals(user.isActive, false);
    assert(user.createdAt instanceof Date);
    assertEquals(user.products, undefined);

    users = await client.query("SELECT * FROM users;");
    assertEquals(users.length, 1);
    assertEquals(users[0].id, user.id);
    assertEquals(users[0].email, user.email);
    assertEquals(users[0].first_name, user.firstName);
    assertEquals(users[0].last_name, user.lastName);
    assertEquals(users[0].age, user.age);
    assertEquals(users[0].password, user.password);
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
      email: "a@b.com",
      firstName: "John",
      lastName: "Doe",
      age: 16,
      password: "12345",
    }, {
      email: "b@c.com",
      firstName: "Jane",
      lastName: "Doe",
      age: 17,
      password: "12345",
    }]);
    assert(Array.isArray(users));
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      assert(user instanceof User);
      assertEquals(user.id, i + 1);
      assertEquals(user.email, i ? "b@c.com" : "a@b.com");
      assertEquals(user.firstName, i ? "Jane" : "John");
      assertEquals(user.lastName, "Doe");
      assertEquals(user.age, i ? 17 : 16);
      assertEquals(user.password, "12345");
      assertEquals(user.isActive, false);
      assert(user.createdAt instanceof Date);
      assertEquals(user.products, undefined);
    }

    const result = await client.query("SELECT * FROM users;");
    assertEquals(result.length, 2);
    for (let i = 0; i < result.length; i++) {
      const data = result[i];
      assertEquals(data.id, users[i].id);
      assertEquals(data.email, users[i].email);
      assertEquals(data.first_name, users[i].firstName);
      assertEquals(data.last_name, users[i].lastName);
      assertEquals(data.age, users[i].age);
      assertEquals(data.password, users[i].password);
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
