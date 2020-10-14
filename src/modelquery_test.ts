import { assertDateEquals, Product, testDB, User } from "./testutils.ts";
import { ModelQuery } from "./modelquery.ts";
import { assert, assertEquals, stub } from "../testdeps.ts";
import { Adapter } from "./adapters/adapter.ts";
import { Q } from "./q.ts";

Deno.test("ModelQuery.where() -> should call `where` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "where");

  const where1 = query1.where("id", 1);
  assertEquals(where1, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, ["id", 1]);

  const query2 = new ModelQuery(User, {} as any);
  const action2 = stub((query2 as any).builder, "where");

  const where2 = query2.where("id", Q.eq(1));
  assertEquals(where2, query2);
  assertEquals(action2.calls.length, 1);
  assertEquals(action2.calls[0].args, ["id", Q.eq(1)]);
});

Deno.test("ModelQuery.or() -> should call `or` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "or");

  const or1 = query1.or("id", 1);
  assertEquals(or1, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, ["id", 1]);

  const query2 = new ModelQuery(User, {} as any);
  const action2 = stub((query2 as any).builder, "or");

  const or2 = query2.or("id", Q.eq(1));
  assertEquals(or2, query2);
  assertEquals(action2.calls.length, 1);
  assertEquals(action2.calls[0].args, ["id", Q.eq(1)]);
});

Deno.test("ModelQuery.not() -> should call `not` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "not");

  const not1 = query1.not("id", 1);
  assertEquals(not1, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, ["id", 1]);

  const query2 = new ModelQuery(User, {} as any);
  const action2 = stub((query2 as any).builder, "not");

  const not2 = query2.not("id", Q.eq(1));
  assertEquals(not2, query2);
  assertEquals(action2.calls.length, 1);
  assertEquals(action2.calls[0].args, ["id", Q.eq(1)]);
});

Deno.test("ModelQuery.order() -> should call `order` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "order");

  const order1 = query1.order("id");
  assertEquals(order1, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, ["id", undefined]);

  const query2 = new ModelQuery(User, {} as any);
  const action2 = stub((query2 as any).builder, "order");

  const order2 = query2.order("id", "DESC");
  assertEquals(order2, query2);
  assertEquals(action2.calls.length, 1);
  assertEquals(action2.calls[0].args, ["id", "DESC"]);
});

Deno.test("ModelQuery.limit() -> should call `limit` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "limit");

  const limit = query1.limit(5);
  assertEquals(limit, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, [5]);
});

Deno.test("ModelQuery.offset() -> should call `offset` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "offset");

  const offset = query1.offset(5);
  assertEquals(offset, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, [5]);
});

async function populateDatabase(client: Adapter) {
  const users = [{
    id: 1,
    email: "a@b.com",
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
    password: "12345",
  }, {
    id: 2,
    email: "a@b.com",
    first_name: "Jane",
    last_name: "Doe",
    age: 17,
    created_at: new Date(),
    is_active: true,
    password: "12345",
  }, {
    id: 3,
    email: "a@b.com",
    first_name: "Tom",
    last_name: "Cruise",
    age: 18,
    created_at: new Date(),
    is_active: true,
    password: "12345",
  }];
  const products = [
    { product_id: 1, title: "Spoon", user_id: 1 },
    { product_id: 2, title: "Table", user_id: 1 },
  ];

  await client.table("users").insert(users).execute();
  await client.table("product").insert(products).execute();

  return { users, products };
}

testDB("ModelQuery.count() -> should count models", async (client) => {
  assertEquals(await new ModelQuery(User, client).count(), 0);
  await populateDatabase(client);
  assertEquals(await new ModelQuery(User, client).count(), 3);
  assertEquals(
    await new ModelQuery(User, client).where("isActive", true).count(),
    2,
  );
});

testDB("ModelQuery.update() -> should update models", async (client) => {
  await populateDatabase(client);
  await new ModelQuery(User, client).where("isActive", true).update({
    email: "b@c.com",
    firstName: "Kevin",
    lastName: "Armstrong",
  });

  const users = await new ModelQuery(User, client)
    .where("isActive", true)
    .all();
  for (const user of users) {
    assertEquals(user.email, "b@c.com");
    assertEquals(user.firstName, "Kevin");
    assertEquals(user.lastName, "Armstrong");
  }
});

testDB("ModelQuery.delete() -> should delete models", async (client) => {
  await populateDatabase(client);
  await new ModelQuery(User, client).where("isActive", true).delete();

  const users = await new ModelQuery(User, client)
    .where("isActive", true)
    .all();
  assertEquals(users.length, 0);
});

testDB("ModelQuery.all() -> should return all records", async (client) => {
  assertEquals(await new ModelQuery(User, client).all(), []);

  const data = await populateDatabase(client);

  const users = await new ModelQuery(User, client).all();
  assert(Array.isArray(users));
  assertEquals(users.length, 3);

  for (let i = 0; i < users.length; i++) {
    const user = data.users[i];
    assert(users[i] instanceof User);
    assertEquals(users[i].id, i + 1);
    assertEquals(users[i].email, user.email);
    assertEquals(users[i].firstName, user.first_name);
    assertEquals(users[i].lastName, user.last_name);
    assertEquals(users[i].age, user.age);
    assertEquals(users[i].password, user.password);
    assertDateEquals(users[i].createdAt, user.created_at);
    assertEquals(users[i].isActive, user.is_active);
    assertEquals(users[i].products, undefined);
  }
});

testDB("ModelQuery.all() -> should query with constraints", async (client) => {
  await populateDatabase(client);

  let users = await new ModelQuery(User, client).where("lastName", "Doe").all();
  assertEquals(users.length, 2);
  assertEquals(users[0].id, 1);
  assertEquals(users[1].id, 2);

  users = await new ModelQuery(User, client).where("isActive", true).all();
  assertEquals(users.length, 2);
  assertEquals(users[0].id, 2);
  assertEquals(users[1].id, 3);

  users = await new ModelQuery(User, client)
    .where("lastName", "Doe")
    .where("isActive", true)
    .all();
  assertEquals(users.length, 1);
  assertEquals(users[0].id, 2);
});

testDB(
  "ModelQuery.all() -> should have no relation properties by default",
  async (client) => {
    await populateDatabase(client);

    for (const user of await new ModelQuery(User, client).all()) {
      assertEquals(user.products, undefined);
    }

    for (const products of await new ModelQuery(Product, client).all()) {
      assertEquals(products.user, undefined);
    }
  },
);

testDB("ModelQuery.all() -> should fetch the relations", async (client) => {
  await populateDatabase(client);

  const users = await new ModelQuery(User, client).include("products").all();
  for (const user of users) {
    assert(Array.isArray(user.products));
  }

  assertEquals(users[0].products.length, 2);
  assert(users[0].products[0] instanceof Product);
  assertEquals(users[0].products[0].title, "Spoon");
  assert(users[0].products[1] instanceof Product);
  assertEquals(users[0].products[1].title, "Table");

  const products = await new ModelQuery(Product, client).include("user").all();
  for (const product of products) {
    assert(product.user instanceof User);
    assertEquals(product.user.id, 1);
    assertEquals(product.user.firstName, "John");
  }
});

testDB("ModelQuery.first() -> should get a single record", async (client) => {
  assertEquals(await new ModelQuery(User, client).first(), null);

  const { users } = await populateDatabase(client);

  const user = await new ModelQuery(User, client).first();
  assert(user instanceof User);
  assertEquals(user.id, 1);
  assertEquals(user.firstName, users[0].first_name);
  assertEquals(user.lastName, users[0].last_name);
  assertEquals(user.age, users[0].age);
  assertEquals(user.password, users[0].password);
  assertEquals(user.isActive, users[0].is_active);
  assertDateEquals(user.createdAt, users[0].created_at);
});

testDB(
  "ModelQuery.first() -> should query with constraints",
  async (client) => {
    await populateDatabase(client);

    let user = await new ModelQuery(User, client)
      .where("lastName", "Doe")
      .first();
    assert(user instanceof User);
    assertEquals(user.id, 1);

    user = await new ModelQuery(User, client)
      .where("isActive", true)
      .first();
    assert(user instanceof User);
    assertEquals(user.id, 2);

    user = await new ModelQuery(User, client)
      .where("id", 3)
      .first();
    assert(user instanceof User);
    assertEquals(user.id, 3);

    user = await new ModelQuery(User, client)
      .where("id", 5)
      .first();
    assertEquals(user, null);
  },
);

testDB(
  "ModelQuery.first() -> should have no relation properties by default",
  async (client) => {
    await populateDatabase(client);

    const user = await new ModelQuery(User, client).first();
    assertEquals(user!.products, undefined);

    const product = await new ModelQuery(Product, client).first();
    assertEquals(product!.user, undefined);
  },
);

testDB("ModelQuery.first() -> should fetch the relations", async (client) => {
  await populateDatabase(client);

  let user = await new ModelQuery(User, client).include("products").first();
  assert(Array.isArray(user!.products));
  assertEquals(user!.products.length, 2);
  assert(user!.products[0] instanceof Product);
  assertEquals(user!.products[0].title, "Spoon");
  assert(user!.products[1] instanceof Product);
  assertEquals(user!.products[1].title, "Table");

  user = await new ModelQuery(User, client)
    .where("id", 2)
    .include("products")
    .first();
  assert(Array.isArray(user!.products));
  assertEquals(user!.products.length, 0);

  const product = await new ModelQuery(Product, client).include("user").first();
  assert(product!.user instanceof User);
  assertEquals(product!.user.id, 1);
  assertEquals(product!.user.firstName, "John");
});
