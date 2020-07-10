import { Model } from "../models/model.ts";
import { Field } from "../models/fields.ts";
import { testDB } from "../testutils.ts";
import { assertEquals } from "../../testdeps.ts";
import { QueryBuilder } from "../querybuilder.ts";
import { formatDate } from "../utils/date.ts";

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

testDB(
  "BaseAdapter: `addModel` should populate `adapter` property",
  (client) => {
    client.addModel(User);

    assertEquals(User.adapter, client);
  },
);

testDB(
  "BaseAdapter: `getModels` should return an array containing all classes of the registered Models ",
  (client) => {
    client.addModel(User);
    client.addModel(Product);

    const models = client.getModels();

    assertEquals(models.length, 2);
    assertEquals(models[0], User);
    assertEquals(models[1], Product);
  },
);

testDB(
  "BaseAdapter: `truncateModels` should truncate all registered model tables",
  async (client) => {
    const date = new Date("5 June, 2020");

    client.addModel(User);
    client.addModel(Product);

    await client.query(
      `INSERT INTO users (email, age, created_at) VALUES ('a@b.com', 16, '${
        formatDate(date)
      }')`,
    );
    await client.query(
      `INSERT INTO users (email, age, created_at) VALUES ('b@c.com', 16, '${
        formatDate(date)
      }')`,
    );

    await client.query(`INSERT INTO products (name) VALUES ('notebook')`);
    await client.query(`INSERT INTO products (name) VALUES ('pen')`);

    await client.truncateModels();

    const users = await client.query("SELECT * FROM users;");
    const products = await client.query("SELECT * FROM products;");

    assertEquals(users.length, 0);
    assertEquals(products.length, 0);
  },
);

testDB(
  "BaseAdapter: `table` should contains actual query builder",
  (client) => {
    const query = client.table("users");
    assertEquals(query instanceof QueryBuilder, true);
  },
);

testDB("BaseAdapter: `query` bind values", async (client) => {
  let query: string;

  switch (client.dialect) {
    case "mysql":
    case "sqlite":
      query = "insert into users (email, age, created_at) values (?, ?, ?)";
      break;
    case "postgres":
      query = "insert into users (email, age, created_at) values ($1, $2, $3)";
      break;
  }

  await client.query(query, ["a@b.com", 16, formatDate(new Date())]);

  const result = await client.query<{
    id: number;
    email: string;
    age: number;
  }>(`select id, email, age from users;`);

  assertEquals(Array.isArray(result), true);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, 1);
  assertEquals(result[0].email, "a@b.com");
  assertEquals(result[0].age, 16);
});
