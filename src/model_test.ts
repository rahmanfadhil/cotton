import { Column, ColumnType } from "./model.ts";
import { Reflect } from "./utils/reflect.ts";
import { assertEquals, assertThrows } from "../testdeps.ts";
import { metadata } from "./constants.ts";

// TODO: create tests on @Model
// TODO: create tests on @Relation

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
      select: true,
      name: "name",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: true,
    }, {
      propertyKey: "age",
      select: true,
      name: "age",
      type: ColumnType.Number,
      isPrimaryKey: false,
      isNullable: true,
    }, {
      propertyKey: "is_active",
      select: true,
      name: "is_active",
      type: ColumnType.Boolean,
      isPrimaryKey: false,
      isNullable: true,
    }, {
      propertyKey: "created_at",
      select: true,
      name: "created_at",
      type: ColumnType.Date,
      isPrimaryKey: false,
      isNullable: true,
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
      select: true,
      name: "full_name",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: true,
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
      select: true,
      default: "john",
      name: "name",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: true,
    }, {
      propertyKey: "age",
      select: true,
      default: 16,
      name: "age",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: true,
    }, {
      propertyKey: "is_active",
      select: true,
      default: true,
      name: "is_active",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: true,
    }, {
      propertyKey: "created_at",
      select: true,
      default: newDate,
      name: "created_at",
      type: ColumnType.Date,
      isPrimaryKey: false,
      isNullable: true,
    }],
  );
});

Deno.test("Column: custom type", () => {
  class User {
    @Column({ type: ColumnType.Number })
    age!: string;
  }

  assertEquals(
    Reflect.getMetadata(metadata.columns, User.prototype),
    [{
      propertyKey: "age",
      select: true,
      name: "age",
      type: ColumnType.Number,
      isPrimaryKey: false,
      isNullable: true,
    }],
  );
});

Deno.test("Column: explicit deselect", () => {
  class User {
    @Column({ select: false })
    name!: string;
  }

  assertEquals(
    Reflect.getMetadata(metadata.columns, User.prototype),
    [{
      propertyKey: "name",
      select: false,
      name: "name",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: true,
    }],
  );
});

Deno.test("Column: nullable", () => {
  class User {
    @Column({ isNullable: false })
    name!: string;
  }

  assertEquals(
    Reflect.getMetadata(metadata.columns, User.prototype),
    [{
      propertyKey: "name",
      select: true,
      name: "name",
      type: ColumnType.String,
      isPrimaryKey: false,
      isNullable: false,
    }],
  );
});
