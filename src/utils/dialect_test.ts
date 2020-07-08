import { quote } from "./dialect.ts";
import { assertEquals } from "../../testdeps.ts";

Deno.test("quote: should quote a string", () => {
  assertEquals(quote("table", "postgres"), '"table"');
  assertEquals(quote("table", "mysql"), "`table`");
  assertEquals(quote("table", "sqlite"), "`table`");
});

Deno.test("quote: should not quote asteriks", () => {
  assertEquals(quote("*", "postgres"), "*");
  assertEquals(quote("*", "mysql"), "*");
  assertEquals(quote("*", "sqlite"), "*");
});
