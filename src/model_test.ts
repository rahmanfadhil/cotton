import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  RelationDescription,
  RelationType,
} from "./model.ts";
import { Reflect } from "./utils/reflect.ts";
import { assert, assertEquals, assertThrows } from "../testdeps.ts";
import { metadata } from "./constants.ts";

// TODO: if a relation is pointing to itself, throw an error

Deno.test("Model: should define metadata", () => {
  @Model()
  class User {}
  assertEquals(Reflect.getMetadata(metadata.tableName, User), "user");

  @Model("articles")
  class Article {}
  assertEquals(Reflect.getMetadata(metadata.tableName, Article), "articles");
});

Deno.test("Relation: should define metadata", () => {
  class User {
    @HasMany(() => Post, "user_id")
    posts!: Post[];
  }

  class Post {
    @BelongsTo(() => User, "user_id")
    user!: User;
  }

  const user: RelationDescription[] = Reflect.getMetadata(
    metadata.relations,
    User.prototype,
  );
  const post: RelationDescription[] = Reflect.getMetadata(
    metadata.relations,
    Post.prototype,
  );
  assert(Array.isArray(user));
  assert(Array.isArray(post));
  assertEquals(user.length, 1);
  assertEquals(post.length, 1);

  assertEquals(user[0].getModel(), Post);
  assertEquals(post[0].getModel(), User);
  assertEquals(user[0].propertyKey, "posts");
  assertEquals(post[0].propertyKey, "user");
  assertEquals(user[0].type, RelationType.HasMany);
  assertEquals(post[0].type, RelationType.BelongsTo);
  assertEquals(user[0].targetColumn, "user_id");
  assertEquals(post[0].targetColumn, "user_id");
});

Deno.test("Column: basic column", () => {
  class User {
    @Column()
    name!: string;

    @Column()
    age!: number;

    @Column()
    is_active!: boolean;

    @Column()
    created_at!: Date;
  }

  assertEquals(
    Reflect.getMetadata(metadata.columns, User.prototype),
    [{
      propertyKey: "name",
      name: "name",
      type: DataType.String,
      isPrimaryKey: false,
    }, {
      propertyKey: "age",
      name: "age",
      type: DataType.Number,
      isPrimaryKey: false,
    }, {
      propertyKey: "is_active",
      name: "is_active",
      type: DataType.Boolean,
      isPrimaryKey: false,
    }, {
      propertyKey: "created_at",
      name: "created_at",
      type: DataType.Date,
      isPrimaryKey: false,
    }],
  );
});

Deno.test("Column: throw an error if the column type is invalid!", () => {
  assertThrows(
    () => {
      class User {
        @Column()
        name!: string | null;
      }
    },
    Error,
    "Column 'name' must have a type!",
  );
});

Deno.test("Column: custom database column name", () => {
  class User {
    @Column({ name: "full_name" })
    name!: string;
  }

  assertEquals(
    Reflect.getMetadata(metadata.columns, User.prototype),
    [{
      propertyKey: "name",
      name: "full_name",
      type: DataType.String,
      isPrimaryKey: false,
    }],
  );
});

Deno.test("Column: default value", () => {
  const newDate = () => new Date();

  class User {
    @Column({ default: "john" })
    name!: string;

    @Column({ default: 16 })
    age!: string;

    @Column({ default: true })
    is_active!: string;

    @Column({ default: newDate })
    created_at!: Date;
  }

  assertEquals(
    Reflect.getMetadata(metadata.columns, User.prototype),
    [{
      propertyKey: "name",
      default: "john",
      name: "name",
      type: DataType.String,
      isPrimaryKey: false,
    }, {
      propertyKey: "age",
      default: 16,
      name: "age",
      type: DataType.String,
      isPrimaryKey: false,
    }, {
      propertyKey: "is_active",
      default: true,
      name: "is_active",
      type: DataType.String,
      isPrimaryKey: false,
    }, {
      propertyKey: "created_at",
      default: newDate,
      name: "created_at",
      type: DataType.Date,
      isPrimaryKey: false,
    }],
  );
});

Deno.test("Column: custom type", () => {
  class User {
    @Column({ type: DataType.String })
    name!: string | null;
  }

  assertEquals(Reflect.getMetadata(metadata.columns, User.prototype), [{
    propertyKey: "name",
    name: "name",
    type: DataType.String,
    isPrimaryKey: false,
  }]);
});
