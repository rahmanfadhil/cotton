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
      name: "name",
      type: FieldType.String,
      nullable: false,
    }, {
      propertyKey: "age",
      select: true,
      name: "age",
      type: FieldType.Number,
      nullable: false,
    }, {
      propertyKey: "is_active",
      select: true,
      name: "is_active",
      type: FieldType.Boolean,
      nullable: false,
    }, {
      propertyKey: "created_at",
      select: true,
      name: "created_at",
      type: FieldType.Date,
      nullable: false,
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
      name: "full_name",
      type: FieldType.String,
      nullable: false,
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
      nullable: false,
    }, {
      propertyKey: "age",
      select: true,
      default: 16,
      name: "age",
      type: FieldType.String,
      nullable: false,
    }, {
      propertyKey: "is_active",
      select: true,
      default: true,
      name: "is_active",
      type: FieldType.String,
      nullable: false,
    }, {
      propertyKey: "created_at",
      select: true,
      default: newDate,
      name: "created_at",
      type: FieldType.Date,
      nullable: false,
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
      name: "age",
      type: FieldType.Number,
      nullable: false,
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
      name: "name",
      type: FieldType.String,
      nullable: false,
    }],
  );
});

Deno.test("Field: nullable", () => {
  class User {
    @Field({ nullable: true })
    name!: string;
  }

  assertEquals(
    Reflect.getMetadata("db:columns", User.prototype),
    [{
      propertyKey: "name",
      select: true,
      name: "name",
      type: FieldType.String,
      nullable: true,
    }],
  );
});
