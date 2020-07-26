import { User } from "./testutils.ts";
import { Serializer } from "./serializer.ts";
import { assert, assertEquals, assertThrows } from "../testdeps.ts";

Deno.test("Serializer.values() -> should extract values from a model", () => {
  const serializer = new Serializer(User);

  const date = new Date();

  const user = new User();
  user.id = 1;
  user.email = "a@b.com";
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  user.password = "12345";
  user.createdAt = date;
  user.isActive = true;

  assertEquals(serializer.values(user), {
    id: 1,
    email: "a@b.com",
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: date,
    is_active: true,
  });
});

Deno.test("Serializer.from() -> should make model from a value", () => {
  const serializer = new Serializer(User);
  const user = serializer.from({
    id: 1,
    email: "a@b.com",
    first_name: "John",
    last_name: "Doe",
    age: 16,
    password: "12345",
    created_at: new Date(),
    is_active: true,
  });
  assert(user instanceof User);
  assertEquals(user.id, null);
  assertEquals(user.email, "a@b.com");
  assertEquals(user.firstName, "John");
  assertEquals(user.lastName, "Doe");
  assertEquals(user.age, 16);
  assertEquals(user.password, null);
  assertEquals(user.createdAt, null);
  assertEquals(user.isActive, null);
  assertEquals(user.products, undefined);
});

Deno.test("Serializer.from() -> should throw error if required properties not found", () => {
  const serializer = new Serializer(User);
  assertThrows(
    () => {
      serializer.from({});
    },
    Error,
    "Property 'email' cannot be empty!",
  );
});

Deno.test("Serializer.from() -> should throw error if value is not an object", () => {
  const serializer = new Serializer(User);
  assertThrows(
    () => {
      serializer.from("" as any);
    },
    Error,
    "Expected data to be an object, but got 'string'!",
  );
});

Deno.test("Serializer.from() -> should throw error if value type doesn't match", () => {
  const serializer = new Serializer(User);
  assertThrows(
    () => {
      serializer.from({ email: 1 });
    },
    Error,
    "Property 'email' should be of type 'string', but got 'number'",
  );
});
