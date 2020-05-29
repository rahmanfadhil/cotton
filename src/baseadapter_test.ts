import { BaseAdapter } from "./baseadapter.ts";
import { Model } from "./model.ts";
import { testDB } from "./testutils.ts";
import { assertEquals } from "../testdeps.ts";
import { QueryBuilder } from "./querybuilder.ts";

testDB(
  "BaseAdapter: `addModel` should populate `adapter` property",
  (client) => {
    class User extends Model {
      static tableName = "users";
    }
    client.addModel(User);

    assertEquals(User.adapter, client);
  },
);

testDB(
  "BaseAdapter: `queryBuilder` should contains actual query builder",
  (client) => {
    const query = client.queryBuilder("users");
    assertEquals(query instanceof QueryBuilder, true);
  },
);
