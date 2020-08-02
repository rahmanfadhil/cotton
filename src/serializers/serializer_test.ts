import { Serializer, SerializationError } from "./serializer.ts";
import { User, Product } from "../testutils.ts";
import { assert, assertEquals, assertThrows } from "../../testdeps.ts";
import { formatDate } from "../utils/date.ts";

Deno.test("Serializer.load() -> should load a model", () => {
  const serializer = new Serializer(User);
  const model = serializer.load({ email: "a@b.com", first_name: "John" });
  assert(model instanceof User);
  assertEquals(model.id, null);
  assertEquals(model.email, "a@b.com");
  assertEquals(model.firstName, "John");
  assertEquals(model.lastName, null);
});

Deno.test("Serializer.load() -> should error if non nullable property is null", () => {
  const product = {
    productId: 1,
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
  const product = {
    product_id: "asdfasdf" as any,
    title: "Spoon",
  };

  const serializer = new Serializer(Product);
  const error = assertThrows(
    () => serializer.load(product),
    SerializationError,
    "Failed to serialize 'Product' model!",
  ) as SerializationError;
  assertEquals(error.errors, [{
    target: "product_id",
    message: "invalid number!",
  }]);
});

Deno.test("Serializer.toJSON() -> should serialize model to JSON compatible object", () => {
  const user = new User();
  user.email = "a@b.com";
  user.firstName = "John";
  user.lastName = "Doe";
  user.age = 16;
  user.password = "12345";
  user.createdAt = new Date();
  user.isActive = true;

  const serializer = new Serializer(User);

  assertEquals(serializer.toJSON(user), {
    id: null,
    email: "a@b.com",
    first_name: "John",
    last_name: "Doe",
    age: 16,
    created_at: formatDate(user.createdAt),
    is_active: true,
  });
});

Deno.test("Serializer.toJSON() -> should serialize multiple models", () => {
  const serializer = new Serializer(Product);

  const product1 = new Product();
  product1.title = "Spoon";
  const product2 = new Product();
  product2.title = "Table";

  assertEquals(serializer.toJSON([product1, product2]), [
    { product_id: null, title: "Spoon" },
    { product_id: null, title: "Table" },
  ]);
});

Deno.test("Serializer.toJSON() -> should error if non nullable property is null", () => {
  const product = new Product();
  product.productId = 1;

  const serializer = new Serializer(Product);
  const error = assertThrows(
    () => serializer.toJSON(product),
    SerializationError,
    "Failed to serialize 'Product' model!",
  ) as SerializationError;
  assertEquals(error.errors, [{
    target: "title",
    message: "value cannot be empty!",
  }]);
});

Deno.test("Serializer.toJSON() -> should error if failed to serialize data", () => {
  const product = new Product();
  product.productId = "asdfasdf" as any;
  product.title = "Spoon";

  const serializer = new Serializer(Product);
  const error = assertThrows(
    () => serializer.toJSON(product),
    SerializationError,
    "Failed to serialize 'Product' model!",
  ) as SerializationError;
  assertEquals(error.errors, [{
    target: "productId",
    message: "invalid number!",
  }]);
});
