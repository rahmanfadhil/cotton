import { Column, FieldType } from "./fields.ts";
import { Reflect } from "../utils/reflect.ts";
import { assertEquals, assertThrows } from "../../testdeps.ts";
import { metadata } from "../constants.ts";

Deno.test("Field: basic field", () => {
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
      type: FieldType.String,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "age",
      select: true,
      name: "age",
      type: FieldType.Number,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "is_active",
      select: true,
      name: "is_active",
      type: FieldType.Boolean,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "created_at",
      select: true,
      name: "created_at",
      type: FieldType.Date,
      isPrimaryKey: false,
      isNullable: false,
    }],
  );
});

Deno.test("Field: throw an error if the column type is invalid!", () => {
  assertThrows(
    () => {
      class User {
        @Column()
        name!: string | null;
      }
    },
    Error,
    "Cannot assign column 'name' without a type!",
  );
});

Deno.test("Field: custom database column name", () => {
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
      type: FieldType.String,
      isPrimaryKey: false,
      isNullable: false,
    }],
  );
});

Deno.test("Field: default value", () => {
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
      type: FieldType.String,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "age",
      select: true,
      default: 16,
      name: "age",
      type: FieldType.String,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "is_active",
      select: true,
      default: true,
      name: "is_active",
      type: FieldType.String,
      isPrimaryKey: false,
      isNullable: false,
    }, {
      propertyKey: "created_at",
      select: true,
      default: newDate,
      name: "created_at",
      type: FieldType.Date,
      isPrimaryKey: false,
      isNullable: false,
    }],
  );
});

Deno.test("Field: custom type", () => {
  class User {
    @Column({ type: FieldType.Number })
    age!: string;
  }

  assertEquals(
    Reflect.getMetadata(metadata.columns, User.prototype),
    [{
      propertyKey: "age",
      select: true,
      name: "age",
      type: FieldType.Number,
      isPrimaryKey: false,
      isNullable: false,
    }],
  );
});

Deno.test("Field: explicit deselect", () => {
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
      type: FieldType.String,
      isPrimaryKey: false,
      isNullable: false,
    }],
  );
});

Deno.test("Field: nullable", () => {
  class User {
    @Column({ isNullable: true })
    name!: string;
  }

  assertEquals(
    Reflect.getMetadata(metadata.columns, User.prototype),
    [{
      propertyKey: "name",
      select: true,
      name: "name",
      type: FieldType.String,
      isPrimaryKey: false,
      isNullable: true,
    }],
  );
});
