import { NumberUtils } from "./number.ts";
import { assertEquals } from "../../testdeps.ts";

Deno.test("NumberUtils: range", () => {
  assertEquals(NumberUtils.range(5, 10), [5, 6, 7, 8, 9, 10]);
  assertEquals(NumberUtils.range(7, 14), [7, 8, 9, 10, 11, 12, 13, 14]);
});
