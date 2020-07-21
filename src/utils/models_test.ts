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
} from "./models.ts";
import {
  Model,
  Column,
  Primary,
  Relation,
  RelationType,
  ColumnType,
} from "../model.ts";
import { assertEquals, assertThrows, assert } from "../../testdeps.ts";
import { formatDate } from "../utils/date.ts";

const toUser = () => User;
const toPost = () => Post;
const toProduct = () => Product;

const getCreationDate = () => new Date();

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

  @Relation(RelationType.HasMany, toPost, "user_id")
  posts!: Post[];

  @Relation(RelationType.HasMany, toProduct, "product_id")
  products!: Product[];
}

@Model("posts")
class Post {
  @Primary()
  id!: number;

  @Column({ isNullable: false })
  title!: string;

  @Column({ name: "is_published", default: false })
  isPublished!: boolean;

  @Column({ name: "created_at", default: getCreationDate })
  createdAt!: Date;

  @Relation(RelationType.BelongsTo, toUser, "user_id")
  user!: User;
}

@Model("products")
class Product {
  @Primary({ name: "identifier" })
  productId!: number;

  @Column()
  name!: string;

  @Relation(RelationType.BelongsTo, toUser, "product_id")
  user!: User;
}

Deno.test("getTableName() -> should get the model's custom table name", () => {
  assertEquals(getTableName(User), "users");
  assertEquals(getTableName(Post), "posts");
  assertEquals(getTableName(Product), "products");
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
  assertEquals(
    getColumns(User),
    [{
      propertyKey: "id",
      select: true,
      name: "id",
      type: ColumnType.Number,
      isPrimaryKey: true,
      isNullable: false,
    }, {
      propertyKey: "firstName",
      select: true,
      name: "first_name",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "lastName",
      select: true,
      name: "last_name",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "age",
      select: true,
      name: "age",
      type: ColumnType.Number,
      isPrimaryKey: false,
      isNullable: true,
    }],
  );

  assertEquals(
    getColumns(Post),
    [{
      propertyKey: "id",
      select: true,
      name: "id",
      type: ColumnType.Number,
      isPrimaryKey: true,
      isNullable: false,
    }, {
      propertyKey: "title",
      select: true,
      name: "title",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "isPublished",
      select: true,
      name: "is_published",
      type: ColumnType.Boolean,
      isPrimaryKey: false,
      isNullable: true,
      default: false,
    }, {
      propertyKey: "createdAt",
      select: true,
      name: "created_at",
      type: ColumnType.Date,
      isPrimaryKey: false,
      isNullable: true,
      default: getCreationDate,
    }],
  );

  assertEquals(
    getColumns(Product),
    [{
      propertyKey: "productId",
      select: true,
      name: "identifier",
      type: ColumnType.Number,
      isPrimaryKey: true,
      isNullable: false,
    }, {
      propertyKey: "name",
      select: true,
      name: "name",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: true,
    }],
  );
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
    propertyKey: "posts",
    type: RelationType.HasMany,
    getModel: toPost,
    targetColumn: "user_id",
  }, {
    propertyKey: "products",
    type: RelationType.HasMany,
    getModel: toProduct,
    targetColumn: "product_id",
  }]);

  assertEquals(getRelations(Post), [{
    propertyKey: "user",
    type: RelationType.BelongsTo,
    getModel: toUser,
    targetColumn: "user_id",
  }]);

  assertEquals(getRelations(Product), [{
    propertyKey: "user",
    type: RelationType.BelongsTo,
    getModel: toUser,
    targetColumn: "product_id",
  }]);
});

Deno.test("getRelations() -> should only return the relations passed by the parameter", () => {
  assertEquals(getRelations(User, ["products"]), [{
    propertyKey: "products",
    type: RelationType.HasMany,
    getModel: toProduct,
    targetColumn: "product_id",
  }]);

  assertEquals(getRelations(User, ["posts", "products"]), [{
    propertyKey: "posts",
    type: RelationType.HasMany,
    getModel: toPost,
    targetColumn: "user_id",
  }, {
    propertyKey: "products",
    type: RelationType.HasMany,
    getModel: toProduct,
    targetColumn: "product_id",
  }]);

  assertEquals(getRelations(User, []), []);
});

Deno.test("getPrimaryKeyInfo() -> should get the model's primary key column definition", () => {
  assertEquals(getPrimaryKeyInfo(User), {
    propertyKey: "id",
    select: true,
    name: "id",
    type: ColumnType.Number,
    isPrimaryKey: true,
    isNullable: false,
  });

  assertEquals(getPrimaryKeyInfo(Product), {
    propertyKey: "productId",
    select: true,
    name: "identifier",
    type: ColumnType.Number,
    isPrimaryKey: true,
    isNullable: false,
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
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  assertEquals(isSaved(user), false);
  assertEquals(getOriginal(user), undefined);
  assertEquals(compareWithOriginal(user).isDirty, true);
  assertEquals(compareWithOriginal(user).diff, {});

  setSaved(user, true);
  assertEquals(isSaved(user), true);
  assertEquals(getOriginal(user), {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    age: 16,
  });
  assertEquals(compareWithOriginal(user).isDirty, false);
  assertEquals(compareWithOriginal(user).diff, {});

  user.firstName = "Jane";
  assertEquals(isSaved(user), true);
  assertEquals(getOriginal(user), {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    age: 16,
  });
  assertEquals(compareWithOriginal(user).isDirty, true);
  assertEquals(compareWithOriginal(user).diff, { first_name: "Jane" });

  setSaved(user, true);
  assertEquals(isSaved(user), true);
  assertEquals(getOriginal(user), {
    id: 1,
    first_name: "Jane",
    last_name: "Doe",
    age: 16,
  });
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
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  setSaved(user, true);
  user.age = "16" as any;
  assertEquals(compareWithOriginal(user).diff, { age: 16 });
});

Deno.test("getValues() -> should return the values of a model", () => {
  // Select columns and ignore the rest

  const user = new User();
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;

  assertEquals(getValues(user), {
    first_name: "John",
    last_name: "Doe",
    age: 16,
  });
});

Deno.test("getValues() -> should use default value if exists", () => {
  const post = new Post();
  post.title = "Post 1";

  const values = getValues(post);
  assertEquals(values.title, "Post 1");
  assertEquals(values.is_published, false);
  assert(values.created_at instanceof Date);
});

Deno.test("getValues() -> throw an error if the a not nullable column is null", () => {
  const post = new Post();
  assertThrows(
    () => {
      getValues(post);
    },
    Error,
    "Column 'title' cannot be empty!",
  );
  post.title = "Post 1";
  const values = getValues(post);
  assertEquals(values.title, "Post 1");
  assertEquals(values.is_published, false);
  assert(values.created_at instanceof Date);
});

Deno.test("mapValueProperties() -> should rename all properties from name to propertyKey", () => {
  const post = new Post();
  post.title = "Post 1";
  const values = getValues(post);

  assertEquals(mapValueProperties(Post, values, "propertyKey"), {
    title: values.title,
    isPublished: values.is_published,
    createdAt: values.created_at,
  });
});

Deno.test("mapValueProperties() -> should rename all properties from propertyKey to name", () => {
  const data = { title: "Post 1", isPublished: true, createdAt: new Date() };
  assertEquals(mapValueProperties(Post, data, "name"), {
    title: data.title,
    is_published: data.isPublished,
    created_at: data.createdAt,
  });
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
      products__name: "Spoon",
      products__identifier: 1,
    }, {
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
      products__name: "Rice",
      products__identifier: 2,
    }, {
      users__id: 2,
      users__first_name: "Jane",
      users__last_name: "Doe",
      users__age: 17,
      products__name: "Table",
      products__identifier: 3,
    }, {
      users__id: 3,
      users__first_name: "Tom",
      users__last_name: "Cruise",
      users__age: 18,
      products__name: null,
      products__identifier: null,
    }], ["products"]),
    [{
      id: 1,
      firstName: "John",
      lastName: "Doe",
      age: 16,
      products: [
        { name: "Spoon", productId: 1 },
        { name: "Rice", productId: 2 },
      ],
    }, {
      id: 2,
      firstName: "Jane",
      lastName: "Doe",
      age: 17,
      products: [
        { name: "Table", productId: 3 },
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
      products__name: "Spoon",
      products__identifier: 1,
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
    }, {
      products__name: "Rice",
      products__identifier: 2,
      users__id: 1,
      users__first_name: "John",
      users__last_name: "Doe",
      users__age: 16,
    }, {
      products__name: "Table",
      products__identifier: 3,
      users__id: null,
      users__first_name: null,
      users__last_name: null,
      users__: null,
    }], ["user"]),
    [{
      productId: 1,
      name: "Spoon",
      user: { firstName: "John", lastName: "Doe", age: 16, id: 1 },
    }, {
      productId: 2,
      name: "Rice",
      user: { firstName: "John", lastName: "Doe", age: 16, id: 1 },
    }, {
      productId: 3,
      name: "Table",
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
    posts__title: "Post 1",
    posts__is_published: 0,
    posts__created_at: date,
    posts__id: 2,
  };

  assertEquals(
    mapSingleQueryResult(User, data),
    { id: 1, firstName: "John", lastName: "Doe", age: 16 },
  );

  assertEquals(
    mapSingleQueryResult(Post, data),
    { id: 2, title: "Post 1", isPublished: 0, createdAt: date },
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
  assertEquals(typeof user.posts, "undefined");

  const date = new Date();

  const post = createModel(Post, {
    title: "Post 1",
    isPublished: 0,
    createdAt: formatDate(date),
  });

  assert(post instanceof Post);
  assertEquals(post.title, "Post 1");
  assertEquals(post.isPublished, false);
  assertEquals(post.createdAt, date);
});

Deno.test("createModel() -> should create a HasMany relational model", () => {
  const date = new Date();
  const user = createModel(User, {
    firstName: "John",
    lastName: "Doe",
    age: 16,
    posts: [
      { title: "Post 1", isPublished: 0, createdAt: date },
      { title: "Post 2", isPublished: 1, createdAt: date },
    ],
  });

  assert(user instanceof User);
  assertEquals(user.firstName, "John");
  assertEquals(user.lastName, "Doe");
  assertEquals(user.age, 16);
  assert(Array.isArray(user.posts));
  assertEquals(user.posts.length, 2);
  assertEquals(user.posts[0].title, "Post 1");
  assertEquals(user.posts[0].isPublished, false);
  assertEquals(user.posts[0].createdAt, date);
  assertEquals(user.posts[1].title, "Post 2");
  assertEquals(user.posts[1].isPublished, true);
  assertEquals(user.posts[1].createdAt, date);
});

Deno.test("createModel() -> should create a BelongsTo relational model", () => {
  const date = new Date();
  const post = createModel(Post, {
    title: "Post 1",
    isPublished: 0,
    createdAt: formatDate(date),
    user: {
      firstName: "John",
      lastName: "Doe",
      age: 16,
    },
  });

  assert(post instanceof Post);
  assertEquals(post.title, "Post 1");
  assertEquals(post.isPublished, false);
  assertEquals(post.createdAt, date);
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
        name: "Spoon",
        productId: 1,
        user: {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          age: 16,
        },
      },
      { name: "Rice", productId: 2 },
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
  assertEquals(users[0].products[0].name, "Spoon");
  assertEquals(users[0].products[0].productId, 1);
  assert(users[0].products[0].user instanceof User);
  assertEquals(users[0].products[0].user.id, 1);
  assertEquals(users[0].products[0].user.firstName, "John");
  assert(users[0].products[1] instanceof Product);
  assertEquals(users[0].products[1].name, "Rice");
  assertEquals(users[0].products[1].productId, 2);
  assertEquals(typeof users[0].products[1].user, "undefined");
  assertEquals(users[0].firstName, "John");
  assertEquals(users[0].lastName, "Doe");
  assertEquals(users[0].age, 16);

  assertEquals(users[1].id, 3);
  assertEquals(users[1].firstName, "Tom");
  assertEquals(users[1].lastName, "Cruise");
  assertEquals(users[1].age, 18);
  assertEquals(typeof users[1].posts, "undefined");
});
