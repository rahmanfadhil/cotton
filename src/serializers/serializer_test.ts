import { Serializer, SerializationError } from "./serializer.ts";
import { User, Product } from "../testutils.ts";
import { assert, assertEquals, assertThrows } from "../../testdeps.ts";
import { formatDate } from "../utils/date.ts";

Deno.test("Serializer.load() -> should load a model", () => {
  const serializer = new Serializer(User);
  const model = serializer.load({
    email: "a@b.com",
    first_name: "John",
    password: "12345",
  });
  assert(model instanceof User);
  assertEquals(model.id, undefined);
  assertEquals(model.email, "a@b.com");
  assertEquals(model.firstName, "John");
  assertEquals(model.lastName, null);
  assertEquals(model.password, undefined);
  assertEquals(model.createdAt, undefined);
});

Deno.test("Serializer.loadMany() -> should load multiple models", () => {
  const serializer = new Serializer(Product);
  const models = serializer.loadMany([
    { title: "Spoon" },
    { title: "Table" },
  ]);
  assert(Array.isArray(models));
  assertEquals(models.length, 2);

  for (const [index, model] of models.entries()) {
    assertEquals(model.productId, undefined);
    assertEquals(model.title, index ? "Table" : "Spoon");
  }
});

Deno.test("Serializer.load() -> should error if non nullable property is null", () => {
  const product = {
    product_id: 1,
  };

  const serializer = new Serializer(Product);
  const error = assertThrows(
    () => serializer.load(product),
    SerializationError,
    "Failed to serialize 'Product' model!",
  ) as SerializationError;
  assertEquals(error.errors, [{
    target: "title",
    message: "value cannot be empty!",
  }]);
});

Deno.test("Serializer.load() -> should error if failed to serialize data", () => {
  const user = {
    email: "a@b.com",
    age: "adsf",
  };

  const serializer = new Serializer(User);
  const error = assertThrows(
    () => serializer.load(user),
    SerializationError,
    "Failed to serialize 'User' model!",
  ) as SerializationError;
  assertEquals(error.errors, [{
    target: "age",
    message: "invalid number!",
  }]);
});

Deno.test("Serializer.dump() -> should serialize model to JSON compatible object", () => {
  const user = new User();
  user.email = "a@b.com";
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  user.password = "12345";
  user.createdAt = new Date();
  user.isActive = true;

  const serializer = new Serializer(User);

  assertEquals(serializer.dump(user), {
    id: null,
    email: "a@b.com",
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: formatDate(user.createdAt),
    is_active: true,
  });
});

Deno.test("Serializer.dump() -> should serialize multiple models", () => {
  const serializer = new Serializer(Product);

  const product1 = new Product();
  product1.title = "Spoon";
  const product2 = new Product();
  product2.title = "Table";

  assertEquals(serializer.dump([product1, product2]), [
    { product_id: null, title: "Spoon" },
    { product_id: null, title: "Table" },
  ]);
});

Deno.test("Serializer.dump() -> should error if non nullable property is null", () => {
  const product = new Product();
  product.productId = 1;

  const serializer = new Serializer(Product);
  const error = assertThrows(
    () => serializer.dump(product),
    SerializationError,
    "Failed to serialize 'Product' model!",
  ) as SerializationError;
  assertEquals(error.errors, [{
    target: "title",
    message: "value cannot be empty!",
  }]);
});

Deno.test("Serializer.dump() -> should error if failed to serialize data", () => {
  const product = new Product();
  product.productId = "asdfasdf" as any;
  product.title = "Spoon";

  const serializer = new Serializer(Product);
  const error = assertThrows(
    () => serializer.dump(product),
    SerializationError,
    "Failed to serialize 'Product' model!",
  ) as SerializationError;
  assertEquals(error.errors, [{
    target: "productId",
    message: "invalid number!",
  }]);
});
