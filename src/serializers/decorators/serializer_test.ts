import { User } from "../../testutils.ts";
import { assertEquals } from "../../../testdeps.ts";
import { Reflect } from "../../utils/reflect.ts";
import { metadata } from "../../constants.ts";
import { TypeSerializer } from "../serializers/typeserializer.ts";
import { DataType } from "../../model.ts";

Deno.test("Serializable() -> should add correct seralizable properties in metadata", () => {
  assertEquals(Reflect.getMetadata(metadata.serializables, User.prototype), [{
    isHidden: false,
    isReadonly: true,
    isRequired: false,
    name: "id",
    propertyKey: "id",
    serialize: new TypeSerializer(DataType.Number),
  }, {
    isHidden: false,
    isReadonly: false,
    isRequired: true,
    name: "email",
    propertyKey: "email",
    serialize: new TypeSerializer(DataType.String),
  }, {
    isHidden: false,
    isReadonly: false,
    isRequired: false,
    name: "first_name",
    propertyKey: "firstName",
    serialize: new TypeSerializer(DataType.String),
  }, {
    isHidden: false,
    isReadonly: false,
    isRequired: false,
    name: "last_name",
    propertyKey: "lastName",
    serialize: new TypeSerializer(DataType.String),
  }, {
    isHidden: false,
    isReadonly: false,
    isRequired: false,
    name: "age",
    propertyKey: "age",
    serialize: new TypeSerializer(DataType.Number),
  }, {
    isHidden: true,
    isReadonly: true,
    isRequired: false,
    name: "password",
    propertyKey: "password",
    serialize: new TypeSerializer(DataType.String),
  }, {
    isHidden: false,
    isReadonly: true,
    isRequired: false,
    name: "created_at",
    propertyKey: "createdAt",
    serialize: new TypeSerializer(DataType.Date),
  }, {
    isHidden: false,
    isReadonly: false,
    isRequired: false,
    name: "is_active",
    propertyKey: "isActive",
    serialize: new TypeSerializer(DataType.Boolean),
  }]);
});
