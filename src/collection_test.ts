import { Collection } from "./collection.ts";
import { assert, assertEquals, assertThrows } from "../testdeps.ts";
import { Model, Primary, Column, HasMany, BelongsTo } from "./model.ts";
import { setSaved } from "./utils/models.ts";
import { testDB } from "./testutils.ts";
import { Manager } from "./manager.ts";
import { Adapter } from "./adapters/adapter.ts";

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

  @HasMany(() => Product, "user_id")
  products!: Product[];
}

@Model("products")
class Product {
  @Primary()
  id!: number;

  @Column({ isNullable: false })
  title!: string;

  @BelongsTo(() => User, "user_id")
  user!: User;
}

Deno.test("Collection -> should inherit Array", () => {
  assert(Collection.prototype instanceof Array);
});

Deno.test("Collection.getPrimaryKeys() -> should return all primary keys", () => {
  let products = [];

  for (let i = 0; i < 5; i++) {
    const product = new Product();
    product.title = "Product " + i;
    product.id = i + 1;
    setSaved(product, true);
    products.push(product);
  }

  let collection = new Collection({} as any, Product, ...products);
  assertEquals(collection.getPrimaryKeys(), [1, 2, 3, 4, 5]);
});

Deno.test(
  "Collection.getPrimaryKeys() -> should throw an error if an unsaved model found",
  () => {
    // Throw an error if an unsaved models found
    assertThrows(
      () => {
        let products = [];
        for (let i = 0; i < 5; i++) {
          const product = new Product();
          product.title = "Product " + i;
          product.id = i + 1;
          products.push(product);
        }
        new Collection({} as any, Product, ...products).getPrimaryKeys();
      },
      Error,
      "Unsaved model found in 'Product' collection!",
    );

    // Throw an error if a model that has no primary key found
    assertThrows(
      () => {
        let products = [];
        for (let i = 0; i < 5; i++) {
          const product = new Product();
          product.title = "Product " + i;
          setSaved(product, true);
          products.push(product);
        }
        new Collection({} as any, Product, ...products).getPrimaryKeys();
      },
      Error,
      "Unsaved model found in 'Product' collection!",
    );
  },
);

async function populateDatabase(client: Adapter) {
  const user = {
    first_name: "John",
    last_name: "Doe",
    age: 16,
    is_active: true,
    created_at: new Date(),
  };
  await client.table("users").insert([
    { id: 1, ...user },
    { id: 2, ...user },
    { id: 3, ...user },
  ]).execute();
  await client.table("products").insert([
    { id: 1, title: "Spoon", user_id: 2 },
    { id: 2, title: "Spoon", user_id: 2 },
    { id: 3, title: "Spoon", user_id: 1 },
    { id: 4, title: "Spoon", user_id: null },
  ]).execute();
}

testDB(
  "Collection.load() -> should load has many relations",
  async (client) => {
    await populateDatabase(client);

    const users = await new Manager(client).query(User).all();
    const collection = new Collection(client, User, ...users);
    await collection.load("products");

    assert(collection[0].products instanceof Collection);
    assertEquals(collection[0].products.length, 1);
    assert(collection[0].products[0] instanceof Product);

    assert(collection[1].products instanceof Collection);
    assertEquals(collection[1].products.length, 2);
    assert(collection[1].products[0] instanceof Product);
    assert(collection[1].products[1] instanceof Product);

    assert(collection[2].products instanceof Collection);
    assertEquals(collection[2].products.length, 0);
  },
);

testDB(
  "Collection.load() -> should load belongs to relations",
  async (client) => {
    await populateDatabase(client);

    const products = await new Manager(client).query(Product).all();
    const collection = new Collection(client, Product, ...products);
    await collection.load("user");

    assert(collection[0].user instanceof User);
    assert(collection[1].user instanceof User);
    assert(collection[2].user instanceof User);
    assertEquals(collection[3].user, undefined);
  },
);
