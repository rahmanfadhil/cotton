import { Serializer, SerializationError } from "./serializer.ts";
import { User } from "../testutils.ts";
import { assert, assertEquals, assertThrows } from "../../testdeps.ts";

Deno.test("Serializer.load() -> should load a model", () => {
  const serializer = new Serializer(User);
  const model = serializer.load({ email: "a@b.com", first_name: "John" });
  assert(model instanceof User);
  assertEquals(model.id, null);
  assertEquals(model.email, "a@b.com");
  assertEquals(model.firstName, "John");
  assertEquals(model.lastName, null);
});

Deno.test("Serializer.load() -> should throw an error if non nullable property is null", () => {
  const serializer = new Serializer(User);

  const error = assertThrows(() => {
    serializer.load({ first_name: "John" });
  }, SerializationError) as SerializationError;

  assertEquals(error.errors, [{
    target: "email",
    message: "value cannot be null!",
  }]);
});
