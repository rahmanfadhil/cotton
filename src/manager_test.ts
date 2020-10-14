import { Product, testDB, User } from "./testutils.ts";
import { Manager } from "./manager.ts";
import { assert, assertEquals, assertThrowsAsync } from "../testdeps.ts";
import { ModelQuery } from "./modelquery.ts";
import { isSaved } from "./utils/models.ts";
import { Q } from "./q.ts";

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
    let result = await client.table("users").execute();
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

    result = await client.table("users").execute();
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

    result = await client.table("users").execute();
    assertEquals(result.length, 1);
    assertEquals(result[0].id, user.id);
    assertEquals(result[0].email, user.email);
    assertEquals(result[0].is_active, client.dialect === "postgres" ? true : 1);
  },
);

testDB(
  "Manager.save() -> throw an error if the object is not a valid model",
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

    const users = await client.table("users").execute();
    assertEquals(users.length, 1);
    assertEquals(users[0].id, user.id);
    assertEquals(users[0].first_name, user.firstName);

    const products = await client.table("product").execute();
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

    const users = await client.table("users").execute();
    assertEquals(users.length, 1);
    assertEquals(users[0].id, user.id);
    assertEquals(users[0].first_name, user.firstName);

    const products = await client.table("product").execute();
    assertEquals(products.length, 2);
    assertEquals(products[0].product_id, product1.productId);
    assertEquals(products[1].product_id, product2.productId);
    for (let i = 0; i < products.length; i++) {
      assertEquals(products[i].user_id, user.id);
    }
  },
);

testDB("Manager.save() -> should save multiple models", async (client) => {
  const manager = new Manager(client);

  const product1 = new Product();
  product1.title = "Spoon";

  const product2 = new Product();
  product2.title = "Table";
  await manager.save(product2);
  product2.title = "Fork";

  const product3 = new Product();
  product3.title = "Bottle";

  const user1 = new User();
  user1.email = "a@b.com";
  user1.firstName = "John";
  user1.lastName = "Doe";
  user1.age = 16;

  const user2 = new User();
  user2.email = "b@c.com";
  user2.firstName = "Jane";
  user2.lastName = "Doe";
  user2.age = 16;
  await manager.save(user2);
  user2.firstName = "Jason";

  const models = await manager.save(
    [product1, product2, product3, user1, user2],
  );

  assertEquals(models.length, 5);
  for (const model of models) {
    assert(isSaved(model));
  }

  // Check if the update works
  const [userUpdate] = await client
    .table("users")
    .where("id", user2.id)
    .execute();
  assertEquals(userUpdate.first_name, user2.firstName);
  const [productUpdate] = await client
    .table("product")
    .where("product_id", product2.productId)
    .execute();
  assertEquals(productUpdate.title, product2.title);

  // Check if the insert works
  const [userInsert] = await client
    .table("users")
    .where("id", user1.id)
    .execute();
  assertEquals(userInsert.first_name, user1.firstName);
  assertEquals(userInsert.last_name, user1.lastName);
  const productInsert = await client
    .table("product")
    .where("product_id", Q.in([product1.productId, product3.productId]))
    .execute();
  assertEquals(productInsert[0].title, product1.title);
  assertEquals(productInsert[1].title, product3.title);
});

testDB(
  "Manager.remove() -> should remove a model from the database",
  async (client) => {
    await client.table("product").insert({ title: "Spoon" }).execute();

    const manager = new Manager(client);
    const product = await manager.query(Product).first();
    assertEquals(await manager.remove(product!), product);
    assertEquals(product!.productId, undefined);
    assertEquals(isSaved(product!), false);
    assertEquals(await manager.query(Product).first(), null);
  },
);

testDB(
  "Manager.remove() -> should remove multiple models from the database",
  async (client) => {
    await client.table("product").insert([
      { title: "Spoon" },
      { title: "Table" },
      { title: "Fork" },
    ]).execute();
    await client.table("users").insert([
      { email: "a@b.com" },
      { email: "b@c.com" },
      { email: "c@d.com" },
    ]).execute();

    const manager = new Manager(client);
    const users = await manager.query(User).all();
    const products = await manager.query(Product).all();
    const removes = [...users, ...products];

    assertEquals(await manager.remove(removes), removes);

    for (const item of products) {
      assertEquals(item instanceof User ? item.id : item.productId, undefined);
      assert(!isSaved(item));
    }

    assertEquals(await manager.query(User).all(), []);
    assertEquals(await manager.query(Product).all(), []);
  },
);
