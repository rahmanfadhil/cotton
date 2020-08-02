import { User } from "../../testutils.ts";
import { assertEquals } from "../../../testdeps.ts";
import { Reflect } from "../../utils/reflect.ts";
import { metadata } from "../../constants.ts";
import { TypeSerializer } from "../serializers/typeserializer.ts";
import { DataType } from "../../model.ts";

Deno.test("Serializable() -> should add correct seralizable properties in metadata", () => {
  assertEquals(Reflect.getMetadata(metadata.serializables, User.prototype), [{
    isHidden: false,
    isModifiable: true,
    isNullable: true,
    name: "id",
    propertyKey: "id",
    serialize: new TypeSerializer(DataType.Number),
  }, {
    isHidden: false,
    isModifiable: true,
    isNullable: false,
    name: "email",
    propertyKey: "email",
    serialize: new TypeSerializer(DataType.String),
  }, {
    isHidden: false,
    isModifiable: true,
    isNullable: true,
    name: "first_name",
    propertyKey: "firstName",
    serialize: new TypeSerializer(DataType.String),
  }, {
    isHidden: false,
    isModifiable: true,
    isNullable: true,
    name: "last_name",
    propertyKey: "lastName",
    serialize: new TypeSerializer(DataType.String),
  }, {
    isHidden: false,
    isModifiable: true,
    isNullable: true,
    name: "age",
    propertyKey: "age",
    serialize: new TypeSerializer(DataType.Number),
  }, {
    isHidden: true,
    isModifiable: false,
    isNullable: true,
    name: "password",
    propertyKey: "password",
    serialize: new TypeSerializer(DataType.String),
  }, {
    isHidden: false,
    isModifiable: false,
    isNullable: true,
    name: "created_at",
    propertyKey: "createdAt",
    serialize: new TypeSerializer(DataType.Date),
  }, {
    isHidden: false,
    isModifiable: true,
    isNullable: true,
    name: "is_active",
    propertyKey: "isActive",
    serialize: new TypeSerializer(DataType.Boolean),
  }]);
});
