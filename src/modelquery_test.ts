import { testDB } from "./testutils.ts";
import { Model, Primary, Column, Relation, RelationType } from "./model.ts";
import { ModelQuery } from "./modelquery.ts";
import { assertEquals, assert } from "../testdeps.ts";

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

testDB("ModelQuery.all() -> should return all records", async (client) => {
  assertEquals(await new ModelQuery(User, client).all(), []);

  const data = {
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: new Date(),
    is_active: false,
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
  assertEquals(users[0].createdAt, data.created_at);
  assertEquals(users[0].isActive, data.is_active);
  assertEquals(users[0].products, undefined);
});

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

  await client.table("products").insert([
    { id: 1, title: "Spoon", user_id: 1 },
    { id: 2, title: "Table", user_id: 1 },
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
  };
  await client.table("users").insert(data).execute();

  user = await new ModelQuery(User, client).first();
  assert(user instanceof User);
  assertEquals(user.id, 1);
  assertEquals(user.firstName, data.first_name);
  assertEquals(user.lastName, data.last_name);
  assertEquals(user.age, data.age);
  assertEquals(user.isActive, data.is_active);
  assertEquals(user.createdAt, data.created_at);
});

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

  await client.table("products").insert([
    { id: 1, title: "Spoon", user_id: 1 },
    { id: 2, title: "Table", user_id: 1 },
  ]).execute();

  const user = await new ModelQuery(User, client).include("products").first();
  assert(Array.isArray(user!.products));
  assertEquals(user!.products.length, 2);
  assert(user!.products[0] instanceof Product);
  assertEquals(user!.products[0].title, "Spoon");
  assert(user!.products[1] instanceof Product);
  assertEquals(user!.products[1].title, "Table");

  const user1 = await new ModelQuery(User, client)
    .where("id", 1)
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
