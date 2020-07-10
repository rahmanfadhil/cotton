import { Field, FieldType } from "./fields.ts";
import { Reflect } from "../utils/reflect.ts";
import { assertEquals, assertThrows } from "../../testdeps.ts";

Deno.test("Field: basic field", () => {
  class User {
    @Field()
    name!: string;

    @Field()
    age!: number;

    @Field()
    is_active!: boolean;

    @Field()
    created_at!: Date;
  }

  assertEquals(
    Reflect.getMetadata("db:columns", User.prototype),
    [{
      propertyKey: "name",
      select: true,
      default: null,
      name: "name",
      type: FieldType.String,
    }, {
      propertyKey: "age",
      select: true,
      default: null,
      name: "age",
      type: FieldType.Number,
    }, {
      propertyKey: "is_active",
      select: true,
      default: null,
      name: "is_active",
      type: FieldType.Boolean,
    }, {
      propertyKey: "created_at",
      select: true,
      default: null,
      name: "created_at",
      type: FieldType.Date,
    }],
  );
});

Deno.test("Field: throw an error if the column type is invalid!", () => {
  assertThrows(
    () => {
      class User {
        @Field()
        name!: string | null;
      }
    },
    Error,
    "Cannot assign column 'name' without a type!",
  );
});

Deno.test("Field: custom database column name", () => {
  class User {
    @Field({ name: "full_name" })
    name!: string;
  }

  assertEquals(
    Reflect.getMetadata("db:columns", User.prototype),
    [{
      propertyKey: "name",
      select: true,
      default: null,
      name: "full_name",
      type: FieldType.String,
    }],
  );
});

Deno.test("Field: default value", () => {
  const newDate = () => new Date();

  class User {
    @Field({ default: "john" })
    name!: string;

    @Field({ default: 16 })
    age!: string;

    @Field({ default: true })
    is_active!: string;

    @Field({ default: newDate })
    created_at!: Date;
  }

  assertEquals(
    Reflect.getMetadata("db:columns", User.prototype),
    [{
      propertyKey: "name",
      select: true,
      default: "john",
      name: "name",
      type: FieldType.String,
    }, {
      propertyKey: "age",
      select: true,
      default: 16,
      name: "age",
      type: FieldType.String,
    }, {
      propertyKey: "is_active",
      select: true,
      default: true,
      name: "is_active",
      type: FieldType.String,
    }, {
      propertyKey: "created_at",
      select: true,
      default: newDate,
      name: "created_at",
      type: FieldType.Date,
    }],
  );
});

Deno.test("Field: custom type", () => {
  class User {
    @Field({ type: FieldType.Number })
    age!: string;
  }

  assertEquals(
    Reflect.getMetadata("db:columns", User.prototype),
    [{
      propertyKey: "age",
      select: true,
      default: null,
      name: "age",
      type: FieldType.Number,
    }],
  );
});

Deno.test("Field: explicit deselect", () => {
  class User {
    @Field({ select: false })
    name!: string;
  }

  assertEquals(
    Reflect.getMetadata("db:columns", User.prototype),
    [{
      propertyKey: "name",
      select: false,
      default: null,
      name: "name",
      type: FieldType.String,
    }],
  );
});
