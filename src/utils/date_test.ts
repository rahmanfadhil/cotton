import { assertEquals } from "../../testdeps.ts";
import { formatDate, createMigrationTimestamp } from "./date.ts";

Deno.test("formatDate: should format date properly", () => {
  const date = new Date("07 December 2020");
  assertEquals(formatDate(date), "2020-12-07 00:00:00");
});

Deno.test("formatDate: should format date and time properly", () => {
  const date = new Date("27 May 2020, 13:04:01");
  assertEquals(formatDate(date), "2020-05-27 13:04:01");
});

Deno.test("createMigrationTimestamp: should be different everytime it gets invoked", () => {
  const timestamps: string[] = [];
  for (let index = 0; index < 50; index++) {
    const timestamp = createMigrationTimestamp();
    if (timestamps.includes(timestamp)) {
      throw new Error("Duplicate timestamps!");
    }
    assertEquals(timestamp.length, 14);
    timestamps.push(timestamp);
  }
});
