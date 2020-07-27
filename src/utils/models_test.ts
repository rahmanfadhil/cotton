import {
  getTableName,
  getColumns,
  getRelations,
  getPrimaryKeyInfo,
  isSaved,
  setSaved,
  getOriginal,
  compareWithOriginal,
  getValues,
  mapQueryResult,
  mapSingleQueryResult,
  createModel,
  createModels,
  mapValueProperties,
  getRelationValues,
  findColumn,
} from "./models.ts";
import { Model, Column, RelationType, DataType } from "../model.ts";
import {
  Product,
  User,
  toUser,
  toProduct,
  getCreationDate,
} from "../testutils.ts";
import { assertEquals, assertThrows, assert } from "../../testdeps.ts";
import { formatDate } from "../utils/date.ts";

Deno.test("getTableName() -> should get the model's custom table name", () => {
  assertEquals(getTableName(User), "users");
  assertEquals(getTableName(Product), "product");
});

Deno.test("getTableName() -> should get the model's default table name", () => {
  @Model()
  class Article {}

  assertEquals(getTableName(Article), "article");
});

Deno.test("getTableName() -> should throw an error if the class doesn't use @Model decorator", () => {
  class Article {}

  assertThrows(
    () => {
      getTableName(Article);
    },
    Error,
    "Class 'Article' must be wrapped with @Model decorator!",
  );
});

Deno.test("getColumns() -> should return all column definitions", () => {
  assertEquals(getColumns(User), [{
    propertyKey: "id",
    name: "id",
    type: DataType.Number,
    isPrimaryKey: true,
  }, {
    propertyKey: "email",
    name: "email",
    type: DataType.String,
    isPrimaryKey: false,
  }, {
    propertyKey: "firstName",
    name: "first_name",
    type: DataType.String,
    isPrimaryKey: false,
  }, {
    propertyKey: "lastName",
    name: "last_name",
    type: DataType.String,
    isPrimaryKey: false,
  }, {
    propertyKey: "age",
    name: "age",
    type: DataType.Number,
    isPrimaryKey: false,
  }, {
    propertyKey: "password",
    name: "password",
    type: DataType.String,
    isPrimaryKey: false,
  }, {
    propertyKey: "createdAt",
    name: "created_at",
    type: DataType.Date,
    isPrimaryKey: false,
    default: getCreationDate,
  }, {
    propertyKey: "isActive",
    name: "is_active",
    type: DataType.Boolean,
    isPrimaryKey: false,
    default: false,
  }]);

  assertEquals(
    getColumns(Product),
    [{
      propertyKey: "productId",
      name: "product_id",
      type: DataType.Number,
      isPrimaryKey: true,
    }, {
      propertyKey: "title",
      name: "title",
      type: DataType.String,
      isPrimaryKey: false,
    }],
  );
});

Deno.test("findColumn() -> should includes several columns and ignore the rest", () => {
  assertEquals(findColumn(User, "password"), {
    propertyKey: "password",
    name: "password",
    type: DataType.String,
    isPrimaryKey: false,
  });
});

Deno.test("getColumns() -> should throw an error if there's no column found", () => {
  @Model()
  class Article {}

  assertThrows(
    () => {
      getColumns(Article);
    },
    Error,
    "Model 'Article' must have at least one column!",
  );
});

Deno.test("getRelations() -> should return all relations", () => {
  assertEquals(getRelations(User), [{
    propertyKey: "products",
    type: RelationType.HasMany,
    getModel: toProduct,
    targetColumn: "user_id",
  }]);

  assertEquals(getRelations(Product), [{
    propertyKey: "user",
    type: RelationType.BelongsTo,
    getModel: toUser,
    targetColumn: "user_id",
  }]);
});

Deno.test("getRelations() -> should only return the relations passed by the parameter", () => {
  assertEquals(getRelations(User, ["products"]), [{
    propertyKey: "products",
    type: RelationType.HasMany,
    getModel: toProduct,
    targetColumn: "user_id",
  }]);

  assertEquals(getRelations(User, []), []);
});

Deno.test("getPrimaryKeyInfo() -> should get the model's primary key column definition", () => {
  assertEquals(getPrimaryKeyInfo(User), {
    propertyKey: "id",
    name: "id",
    type: DataType.Number,
    isPrimaryKey: true,
  });

  assertEquals(getPrimaryKeyInfo(Product), {
    propertyKey: "productId",
    name: "product_id",
    type: DataType.Number,
    isPrimaryKey: true,
  });
});

Deno.test("getPrimaryKeyInfo() -> should throw an error if there's no primary key", () => {
  @Model()
  class Article {
    @Column()
    name!: string;
  }

  assertThrows(
    () => {
      getPrimaryKeyInfo(Article);
    },
    Error,
    "Model 'Article' must have a primary key!",
  );
});

Deno.test("isSaved(), setSaved(), getOriginal(), and compareWithOriginal()", () => {
  const user = new User();
  user.id = 1;
  user.email = "a@b.com";
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  user.createdAt = new Date();
  assertEquals(isSaved(user), false);
  assertEquals(getOriginal(user), undefined);
  assertEquals(compareWithOriginal(user).isDirty, true);
  assertEquals(compareWithOriginal(user).diff, {});

  const original = {
    id: 1,
    email: "a@b.com",
    first_name: "John",
    last_name: "Doe",
    age: 16,
    password: null,
    created_at: user.createdAt,
    is_active: false,
  };

  setSaved(user, true);
  assertEquals(isSaved(user), true);
  assertEquals(getOriginal(user), original);
  assertEquals(compareWithOriginal(user).isDirty, false);
  assertEquals(compareWithOriginal(user).diff, {});

  user.firstName = "Jane";
  assertEquals(isSaved(user), true);
  assertEquals(getOriginal(user), original);
  assertEquals(compareWithOriginal(user).isDirty, true);
  assertEquals(compareWithOriginal(user).diff, { first_name: "Jane" });

  setSaved(user, true);
  assertEquals(isSaved(user), true);
  assertEquals(getOriginal(user), { ...original, first_name: "Jane" });
  assertEquals(compareWithOriginal(user).isDirty, false);
  assertEquals(compareWithOriginal(user).diff, {});

  setSaved(user, false);
  assertEquals(isSaved(user), false);
  assertEquals(getOriginal(user), undefined);
  assertEquals(compareWithOriginal(user).isDirty, true);
  assertEquals(compareWithOriginal(user).diff, {});
});

Deno.test("compareWithOriginal() -> should return a normalized dirty data", () => {
  const user = new User();
  user.id = 1;
  user.email = "a@b.com";
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  user.password = "12345";
  setSaved(user, true);
  user.firstName = 1 as any;
  user.age = "17" as any;
  assertEquals(compareWithOriginal(user).diff, { first_name: "1", age: 17 });
});

Deno.test("getValues() -> should return the values of a model", () => {
  const user = new User();
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;

  const values = getValues(user);
  assert(values.created_at instanceof Date);
  assertEquals(values, {
    email: null,
    first_name: "John",
    last_name: "Doe",
    age: 16,
    password: null,
    created_at: values.created_at,
    is_active: false,
  });
});

Deno.test("getRelationValues() -> should get has many values", () => {
  const product1 = new Product();
  product1.productId = 1;
  product1.title = "Spoon";
  setSaved(product1, true);

  const product2 = new Product();
  product2.productId = 2;
  product2.title = "Table";
  setSaved(product2, true);

  const user = new User();
  user.id = 1;
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  user.products = [product1, product2];
  setSaved(user, true);

  const userValues = getRelationValues(user);
  assert(Array.isArray(userValues));
  assertEquals(userValues.length, 1);
  assertEquals(userValues[0].value, [product1.productId, product2.productId]);
  assertEquals(userValues[0].description, {
    propertyKey: "products",
    targetColumn: "user_id",
    type: RelationType.HasMany,
    getModel: toProduct,
  });
});

Deno.test("getRelationValues() -> should get belongs to values", () => {
  const user = new User();
  user.id = 1;
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  setSaved(user, true);

  const product1 = new Product();
  product1.productId = 1;
  product1.title = "Spoon";
  product1.user = user;
  setSaved(product1, true);

  const product2 = new Product();
  product2.productId = 1;
  product2.title = "Spoon";
  product2.user = user;
  setSaved(product2, true);

  for (let i = 0; i < 2; i++) {
    const postValues = getRelationValues(i ? product2 : product1);
    assert(Array.isArray(postValues));
    assertEquals(postValues.length, 1);
    assertEquals(postValues[0].value, user.id);
    assertEquals(postValues[0].description, {
      propertyKey: "user",
      targetColumn: "user_id",
      type: RelationType.BelongsTo,
      getModel: toUser,
    });
  }
});

Deno.test("getRelationValues() -> should get nothing when there is no relational data", () => {
  const product = new Product();
  product.productId = 1;
  product.title = "Spoon";
  setSaved(product, true);

  const user = new User();
  user.id = 1;
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  setSaved(user, true);

  const userValues = getRelationValues(user);
  assertEquals(userValues.length, 0);

  const postValues = getRelationValues(product);
  assertEquals(postValues.length, 0);
});

Deno.test("getRelationValues() -> should throw an error if the relation is not saved", () => {
  const product = new Product();
  product.productId = 1;
  product.title = "Spoon";

  const user = new User();
  user.id = 1;
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;

  assertThrows(
    () => {
      user.products = [product];
      getRelationValues(user);
    },
    Error,
    "Unsaved relationships found when trying to insert 'User' model!",
  );

  assertThrows(
    () => {
      product.user = user;
      getRelationValues(product);
    },
    Error,
    "Unsaved relationships found when trying to insert 'Product' model!",
  );
});

Deno.test("mapValueProperties() -> should rename all properties from propertyKey to name vice versa", () => {
  const names = {
    id: 1,
    email: "a@b.com",
    first_name: "John",
    last_name: "Doe",
    created_at: new Date(),
    is_active: true,
  };
  const properties = {
    id: names.id,
    email: names.email,
    firstName: names.first_name,
    lastName: names.last_name,
    createdAt: names.created_at,
    isActive: names.is_active,
  };

  assertEquals(mapValueProperties(User, properties, "name"), names);
  assertEquals(mapValueProperties(User, names, "propertyKey"), properties);
});

Deno.test("mapQueryResult() -> should map a typical query result", () => {
  assertEquals(
    mapQueryResult(User, [{
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
    }, {
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
    }, {
      users__id: 2,
      users__first_name: "Jane",
      users__last_name: "Doe",
      users__age: 17,
    }, {
      users__id: 3,
      users__first_name: "Tom",
      users__last_name: "Cruise",
      users__age: 18,
    }]),
    [{
      id: 1,
      firstName: "John",
      lastName: "Doe",
      age: 16,
    }, {
      id: 2,
      firstName: "Jane",
      lastName: "Doe",
      age: 17,
    }, {
      id: 3,
      firstName: "Tom",
      lastName: "Cruise",
      age: 18,
    }],
  );
});

Deno.test("mapQueryResult() -> should map a HasMany relational query result", () => {
  assertEquals(
    mapQueryResult(User, [{
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
      product__title: "Spoon",
      product__product_id: 1,
    }, {
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
      product__title: "Rice",
      product__product_id: 2,
    }, {
      users__id: 2,
      users__first_name: "Jane",
      users__last_name: "Doe",
      users__age: 17,
      product__title: "Table",
      product__product_id: 3,
    }, {
      users__id: 3,
      users__first_name: "Tom",
      users__last_name: "Cruise",
      users__age: 18,
      product__title: null,
      product__product_id: null,
    }], ["products"]),
    [{
      id: 1,
      firstName: "John",
      lastName: "Doe",
      age: 16,
      products: [
        { title: "Spoon", productId: 1 },
        { title: "Rice", productId: 2 },
      ],
    }, {
      id: 2,
      firstName: "Jane",
      lastName: "Doe",
      age: 17,
      products: [
        { title: "Table", productId: 3 },
      ],
    }, {
      id: 3,
      firstName: "Tom",
      lastName: "Cruise",
      age: 18,
      products: [],
    }],
  );
});

Deno.test("mapQueryResult() -> should map a BelongsTo relational query result", () => {
  assertEquals(
    mapQueryResult(Product, [{
      product__title: "Spoon",
      product__product_id: 1,
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
    }, {
      product__title: "Rice",
      product__product_id: 2,
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
    }, {
      product__title: "Table",
      product__product_id: 3,
      users__id: null,
      users__first_name: null,
      users__last_name: null,
      users__: null,
    }], ["user"]),
    [{
      productId: 1,
      title: "Spoon",
      user: { firstName: "John", lastName: "Doe", age: 16, id: 1 },
    }, {
      productId: 2,
      title: "Rice",
      user: { firstName: "John", lastName: "Doe", age: 16, id: 1 },
    }, {
      productId: 3,
      title: "Table",
      user: null,
    }],
  );
});

Deno.test("mapSingleQueryResult() -> should extract information from the query result for a specific table", () => {
  const date = formatDate(new Date());
  const data = {
    users__id: 1,
    users__first_name: "John",
    users__last_name: "Doe",
    users__age: 16,
    users__password: "12345",
    product__title: "Spoon",
    product__product_id: 2,
  };

  assertEquals(
    mapSingleQueryResult(User, data),
    { id: 1, firstName: "John", lastName: "Doe", age: 16, password: "12345" },
  );

  assertEquals(
    mapSingleQueryResult(Product, data),
    { productId: 2, title: "Spoon" },
  );
});

Deno.test("createModel() -> should create a model", () => {
  const user = createModel(User, {
    firstName: "John",
    lastName: "Doe",
    age: 16,
  });

  assert(user instanceof User);
  assertEquals(user.firstName, "John");
  assertEquals(user.lastName, "Doe");
  assertEquals(user.age, 16);
  assertEquals(typeof user.products, "undefined");

  const product = createModel(Product, { title: "Post 1" });

  assert(product instanceof Product);
  assertEquals(product.title, "Post 1");
});

Deno.test("createModel() -> should create a HasMany relational model", () => {
  const date = new Date();
  const user = createModel(User, {
    firstName: "John",
    lastName: "Doe",
    age: 16,
    products: [
      { title: "Spoon" },
      { title: "Fork" },
    ],
  });

  assert(user instanceof User);
  assertEquals(user.firstName, "John");
  assertEquals(user.lastName, "Doe");
  assertEquals(user.age, 16);
  assert(Array.isArray(user.products));
  assertEquals(user.products.length, 2);
  assertEquals(user.products[0].title, "Spoon");
  assertEquals(user.products[1].title, "Fork");
});

Deno.test("createModel() -> should create a BelongsTo relational model", () => {
  const date = new Date();
  const post = createModel(Product, {
    title: "Spoon",
    isPublished: 0,
    createdAt: formatDate(date),
    user: {
      firstName: "John",
      lastName: "Doe",
      age: 16,
    },
  });

  assert(post instanceof Product);
  assertEquals(post.title, "Spoon");
  assert(post.user instanceof User);
  assertEquals(post.user.firstName, "John");
  assertEquals(post.user.lastName, "Doe");
  assertEquals(post.user.age, 16);
});

Deno.test("createModels() -> should create multiple models with relations", () => {
  const users = createModels(User, [{
    id: 1,
    firstName: "John",
    lastName: "Doe",
    age: 16,
    products: [
      {
        title: "Spoon",
        productId: 1,
        user: {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          age: 16,
        },
      },
      { title: "Rice", productId: 2 },
    ],
  }, {
    id: 3,
    firstName: "Tom",
    lastName: "Cruise",
    age: 18,
  }], true);

  assert(Array.isArray(users));
  assertEquals(users.length, 2);
  assert(users[0] instanceof User);
  assert(users[1] instanceof User);

  assertEquals(users[0].id, 1);
  assertEquals(users[0].firstName, "John");
  assertEquals(users[0].lastName, "Doe");
  assertEquals(users[0].age, 16);
  assert(Array.isArray(users[0].products));
  assertEquals(users[0].products.length, 2);
  assert(users[0].products[0] instanceof Product);
  assertEquals(users[0].products[0].title, "Spoon");
  assertEquals(users[0].products[0].productId, 1);
  assert(users[0].products[0].user instanceof User);
  assertEquals(users[0].products[0].user.id, 1);
  assertEquals(users[0].products[0].user.firstName, "John");
  assert(users[0].products[1] instanceof Product);
  assertEquals(users[0].products[1].title, "Rice");
  assertEquals(users[0].products[1].productId, 2);
  assertEquals(typeof users[0].products[1].user, "undefined");
  assertEquals(users[0].firstName, "John");
  assertEquals(users[0].lastName, "Doe");
  assertEquals(users[0].age, 16);

  assertEquals(users[1].id, 3);
  assertEquals(users[1].firstName, "Tom");
  assertEquals(users[1].lastName, "Cruise");
  assertEquals(users[1].age, 18);
  assertEquals(typeof users[1].products, "undefined");
});
