import { testDB, User, Product } from "./testutils.ts";
import { ModelQuery } from "./modelquery.ts";
import { assertEquals, assert, stub } from "../testdeps.ts";

Deno.test("ModelQuery.where() -> should call `where` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "where");

  const where1 = query1.where("id", 1);
  assertEquals(where1, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, ["id", 1, undefined]);

  const query2 = new ModelQuery(User, {} as any);
  const action2 = stub((query2 as any).builder, "where");

  const where2 = query2.where("id", "=", 1);
  assertEquals(where2, query2);
  assertEquals(action2.calls.length, 1);
  assertEquals(action2.calls[0].args, ["id", "=", 1]);
});

Deno.test("ModelQuery.or() -> should call `or` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "or");

  const or1 = query1.or("id", 1);
  assertEquals(or1, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, ["id", 1, undefined]);

  const query2 = new ModelQuery(User, {} as any);
  const action2 = stub((query2 as any).builder, "or");

  const or2 = query2.or("id", "=", 1);
  assertEquals(or2, query2);
  assertEquals(action2.calls.length, 1);
  assertEquals(action2.calls[0].args, ["id", "=", 1]);
});

Deno.test("ModelQuery.not() -> should call `not` to query builder", () => {
  const query1 = new ModelQuery(User, {} as any);
  const action1 = stub((query1 as any).builder, "not");

  const not1 = query1.not("id", 1);
  assertEquals(not1, query1);
  assertEquals(action1.calls.length, 1);
  assertEquals(action1.calls[0].args, ["id", 1, undefined]);

  const query2 = new ModelQuery(User, {} as any);
  const action2 = stub((query2 as any).builder, "not");

  const not2 = query2.not("id", "=", 1);
  assertEquals(not2, query2);
  assertEquals(action2.calls.length, 1);
  assertEquals(action2.calls[0].args, ["id", "=", 1]);
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

testDB("ModelQuery.all() -> should return all records", async (client) => {
  assertEquals(await new ModelQuery(User, client).all(), []);

  const data = {
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
    password: "12345",
  };
  await client.table("users").insert(data).execute();

  const users = await new ModelQuery(User, client).all();
  assert(Array.isArray(users));
  assertEquals(users.length, 1);
  assert(users[0] instanceof User);
  assertEquals(users[0].id, 1);
  assertEquals(users[0].firstName, data.first_name);
  assertEquals(users[0].lastName, data.last_name);
  assertEquals(users[0].age, data.age);
  assertEquals(users[0].password, data.password);
  assertEquals(users[0].createdAt, data.created_at);
  assertEquals(users[0].isActive, data.is_active);
  assertEquals(users[0].products, undefined);
});

testDB("ModelQuery.all() -> should query with constraints", async (client) => {
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

  let users = await new ModelQuery(User, client).where("lastName", "Doe").all();
  assertEquals(users.length, 2);
  assert(users[0] instanceof User);
  assert(users[1] instanceof User);
  assertEquals(users[0].id, 1);
  assertEquals(users[1].id, 2);

  users = await new ModelQuery(User, client).where("isActive", true).all();
  assertEquals(users.length, 2);
  assert(users[0] instanceof User);
  assert(users[1] instanceof User);
  assertEquals(users[0].id, 2);
  assertEquals(users[1].id, 3);

  users = await new ModelQuery(User, client)
    .where("lastName", "Doe")
    .where("isActive", true)
    .all();
  assertEquals(users.length, 1);
  assert(users[0] instanceof User);
  assertEquals(users[0].id, 2);
});

testDB(
  "ModelQuery.all() -> should have no relation properties by default",
  async (client) => {
    await client.table("users").insert({
      first_name: "John",
      last_name: "Doe",
      age: 16,
      created_at: new Date(),
      is_active: false,
    }).execute();

    await client.table("product").insert({
      title: "Spoon",
      user_id: 1,
    }).execute();

    const users = await new ModelQuery(User, client).all();
    assertEquals(users[0].products, undefined);

    const products = await new ModelQuery(Product, client).all();
    assertEquals(products[0].user, undefined);
  },
);

testDB("ModelQuery.all() -> should fetch the relations", async (client) => {
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

  await client.table("product").insert([
    { product_id: 1, title: "Spoon", user_id: 1 },
    { product_id: 2, title: "Table", user_id: 1 },
  ]).execute();

  const users = await new ModelQuery(User, client).include("products").all();
  assertEquals(users.length, 2);

  assert(Array.isArray(users[0].products));
  assertEquals(users[0].products.length, 2);
  assert(users[0].products[0] instanceof Product);
  assertEquals(users[0].products[0].title, "Spoon");
  assert(users[0].products[1] instanceof Product);
  assertEquals(users[0].products[1].title, "Table");

  assertEquals(users[1].products, []);

  const products = await new ModelQuery(Product, client).include("user").all();
  assertEquals(products.length, 2);
  for (let i = 0; i < products.length; i++) {
    assert(products[i].user instanceof User);
    assertEquals(products[i].user.id, 1);
    assertEquals(products[i].user.firstName, "John");
  }
});

testDB("ModelQuery.first() -> should get a single record", async (client) => {
  let user = await new ModelQuery(User, client).first();
  assertEquals(user, null);

  const data = {
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
    password: "12345",
  };
  await client.table("users").insert(data).execute();

  user = await new ModelQuery(User, client).first();
  assert(user instanceof User);
  assertEquals(user.id, 1);
  assertEquals(user.firstName, data.first_name);
  assertEquals(user.lastName, data.last_name);
  assertEquals(user.age, data.age);
  assertEquals(user.password, data.password);
  assertEquals(user.isActive, data.is_active);
  assertEquals(user.createdAt, data.created_at);
});

testDB(
  "ModelQuery.first() -> should query with constraints",
  async (client) => {
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
  },
);

testDB(
  "ModelQuery.first() -> should have no relation properties by default",
  async (client) => {
    await client.table("users").insert({
      first_name: "John",
      last_name: "Doe",
      age: 16,
      created_at: new Date(),
      is_active: false,
    }).execute();

    await client.table("product").insert({
      title: "Spoon",
      user_id: 1,
    }).execute();

    const user = await new ModelQuery(User, client).first();
    assertEquals(user!.products, undefined);

    const product = await new ModelQuery(Product, client).first();
    assertEquals(product!.user, undefined);
  },
);

testDB("ModelQuery.first() -> should fetch the relations", async (client) => {
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

  await client.table("product").insert([
    { product_id: 1, title: "Spoon", user_id: 1 },
    { product_id: 2, title: "Table", user_id: 1 },
  ]).execute();

  const user = await new ModelQuery(User, client).include("products").first();
  assert(Array.isArray(user!.products));
  assertEquals(user!.products.length, 2);
  assert(user!.products[0] instanceof Product);
  assertEquals(user!.products[0].title, "Spoon");
  assert(user!.products[1] instanceof Product);
  assertEquals(user!.products[1].title, "Table");

  const user1 = await new ModelQuery(User, client)
    .where("firstName", "John")
    .include("products")
    .first();
  assert(Array.isArray(user1!.products));
  assertEquals(user1!.products.length, 2);
  assert(user1!.products[0] instanceof Product);
  assertEquals(user1!.products[0].title, "Spoon");
  assert(user1!.products[1] instanceof Product);
  assertEquals(user1!.products[1].title, "Table");

  const product = await new ModelQuery(Product, client).include("user").first();
  assert(product!.user instanceof User);
  assertEquals(product!.user.id, 1);
  assertEquals(product!.user.firstName, "John");
});
