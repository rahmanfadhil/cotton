import { TypeSerializer } from "./typeserializer.ts";
import { DataType } from "../../model.ts";
import { assertEquals, assertThrows } from "../../../testdeps.ts";
import { formatDate } from "../../utils/date.ts";
import { assertDateEquals } from "../../testutils.ts";

Deno.test("TypeSerializer.up() -> should deserialize a string", () => {
  const serializer = new TypeSerializer(DataType.String);
  assertEquals(serializer.up(4), "4");
  assertEquals(serializer.up("John"), "John");
});

Deno.test("TypeSerializer.up() -> should deserialize a date", () => {
  const serializer = new TypeSerializer(DataType.Date);
  const date = new Date();
  assertDateEquals(serializer.up(formatDate(date)), date);
  assertDateEquals(serializer.up(date.getTime()), date);

  assertThrows(() => serializer.up("asdfasdfa"), Error, "invalid date!");
  assertThrows(
    () => serializer.up(true),
    Error,
    "value must be either string or number!",
  );
});

Deno.test("TypeSerializer.up() -> should deserialize a number", () => {
  const serializer = new TypeSerializer(DataType.Number);
  assertEquals(serializer.up("2"), 2);
  assertEquals(serializer.up(3), 3);

  assertThrows(() => serializer.down("John"), Error, "invalid number!");
});

Deno.test("TypeSerializer.up() -> should deserialize a boolean", () => {
  const serializer = new TypeSerializer(DataType.Boolean);

  // deno-fmt-ignore
  const truthy = [true, {}, [], 42, "0", "false", new Date(), -42, 12n, 3.14, -3.14, Infinity, -Infinity];
  const falsy = [false, null, undefined, 0, -0, 0n, NaN, ""];

  for (const item of truthy) {
    assertEquals(serializer.up(item), true);
  }

  for (const item of falsy) {
    assertEquals(serializer.up(item), false);
  }
});

Deno.test("TypeSerializer.down() -> should serialize a date", () => {
  const serializer = new TypeSerializer(DataType.Date);
  const date = new Date();
  assertEquals(serializer.down(date), formatDate(date));

  assertThrows(() => serializer.down(""), Error, "value must be a date!");
  assertThrows(() => serializer.down(1), Error, "value must be a date!");
  assertThrows(() => serializer.down(false), Error, "value must be a date!");
  assertThrows(
    () => serializer.down(new Date("ajsdfadkfjla")),
    Error,
    "invalid date!",
  );
});

Deno.test("TypeSerializer.down() -> should serialize a string", () => {
  const serializer = new TypeSerializer(DataType.String);
  assertEquals(serializer.down("John"), "John");
  assertEquals(serializer.down(1), "1");
  assertEquals(serializer.down(true), "true");
});

Deno.test("TypeSerializer.down() -> should serialize a number", () => {
  const serializer = new TypeSerializer(DataType.Number);
  assertEquals(serializer.down(2), 2);
  assertEquals(serializer.down("3"), 3);

  assertThrows(() => serializer.down("John"), Error, "invalid number!");
});

Deno.test("TypeSerializer.down() -> should serialize a boolean", () => {
  const serializer = new TypeSerializer(DataType.Boolean);

  // deno-fmt-ignore
  const truthy = [true, {}, [], 42, "0", "false", new Date(), -42, 12n, 3.14, -3.14, Infinity, -Infinity];
  const falsy = [false, null, undefined, 0, -0, 0n, NaN, ""];

  for (const item of truthy) {
    assertEquals(serializer.up(item), true);
  }

  for (const item of falsy) {
    assertEquals(serializer.up(item), false);
  }
});
