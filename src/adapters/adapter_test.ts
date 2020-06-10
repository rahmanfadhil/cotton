import { Model, FieldType } from "../model.ts";
import { testDB } from "../testutils.ts";
import { assertEquals } from "../../testdeps.ts";
import { QueryBuilder } from "../querybuilder.ts";
import { TableBuilder } from "../table.ts";

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

    await User.insert({
      email: "a@b.com",
      age: 16,
      created_at: date,
    });

    await User.insert({
      email: "b@c.com",
      age: 16,
      created_at: date,
    });

    await Product.insert({ name: "notebook" });
    await Product.insert({ name: "pen" });

    await client.truncateModels();

    const users = await User.find();
    const products = await Product.find();

    assertEquals(users.length, 0);
    assertEquals(products.length, 0);
  },
);

testDB(
  "BaseAdapter: `queryBuilder` should contains actual query builder",
  (client) => {
    const query = client.queryBuilder("users");
    assertEquals(query instanceof QueryBuilder, true);
  },
);

testDB(
  "BaseAdapter: `tableBuilder` should contains actual table builder",
  (client) => {
    const query = client.tableBuilder("users");
    assertEquals(query instanceof TableBuilder, true);
  },
);
