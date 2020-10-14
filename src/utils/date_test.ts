import { assertEquals } from "../../testdeps.ts";
import { createMigrationTimestamp, formatDate } from "./date.ts";

Deno.test("formatDate: should format date properly", () => {
  const date = new Date("07 December 2020");
  assertEquals(formatDate(date), "2020-12-07 00:00:00");
});

Deno.test("formatDate: should format date and time properly", () => {
  const date = new Date("27 May 2020, 13:04:01");
  assertEquals(formatDate(date), "2020-05-27 13:04:01");
});

Deno.test("createMigrationTimestamp: should be different everytime it gets invoked", async () => {
  const timestamp = createMigrationTimestamp();
  assertEquals(timestamp.length, 14);
});
