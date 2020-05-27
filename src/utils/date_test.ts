import { assertEquals } from "../../testdeps.ts";
import { DateUtils } from "./date.ts";

Deno.test("DateUtils: should format date properly", () => {
  const date = new Date("07 December 2020");
  assertEquals(DateUtils.formatDate(date), "2020-12-07 00:00:00");
});

Deno.test("DateUtils: should format date and time properly", () => {
  const date = new Date("27 May 2020, 13:04:01");
  assertEquals(DateUtils.formatDate(date), "2020-05-27 13:04:01");
});
