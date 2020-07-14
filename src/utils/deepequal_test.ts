import { deepEqual } from "./deepequal.ts";
import { assertEquals } from "../../testdeps.ts";

Deno.test("deepEqual: should check if objects are equal", () => {
  const a = { a: "a", b: 1, c: [{ b: 1, a: "a" }] };
  const b = { c: [{ a: "a", b: 1 }], a: "a", b: 1 };

  assertEquals(deepEqual(a, b), true);
});

Deno.test("deepEqual: should check if objects are not equal", () => {
  const a = { a: "a", b: 1, c: [{ b: 1, a: "a" }] };
  const b = { c: [{ a: "a", b: 1 }], a: "a", b: 2 };

  assertEquals(deepEqual(a, b), true);
});
