import { assertEquals, assertThrows } from "../../testdeps.ts";
import { TypeSerializer } from "../serializers/serializers/typeserializer.ts";
import { DataType } from "../model.ts";
import { Serializable } from "../serializers/decorators/serializer.ts";
import { getProperties } from "./serializers.ts";

Deno.test("getProperties() -> should get all serializables properties", () => {
  class User {
    @Serializable({ name: "is_active" })
    isActive!: boolean;
  }

  assertEquals(getProperties(User), [{
    isHidden: false,
    isModifiable: true,
    isNullable: true,
    name: "is_active",
    propertyKey: "isActive",
    serialize: new TypeSerializer(DataType.Boolean),
  }]);
});

Deno.test("getProperties() -> should throw an error if the class has no serializable property", () => {
  assertThrows(
    () => {
      class User {}
      getProperties(User);
    },
    Error,
    "Class 'User' must have at least one serializable property!",
  );
});
