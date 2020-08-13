import { uniqueColumnNames } from "./array.ts";
import { assertEquals } from "../../testdeps.ts";

Deno.test("uniqueColumnNames() -> should remove duplicate column names", () => {
  const columns = uniqueColumnNames(["name", "email", "password", "email"]);
  assertEquals(columns, ["name", "email", "password"]);
});

Deno.test("uniqueColumnNames() -> should remove duplicate column names with aliases", () => {
  const columns = uniqueColumnNames([
    ["name", "users_name"],
    ["email", "users_email"],
    "password",
    ["name", "users_email"],
  ]);
  assertEquals(columns, [
    ["name", "users_name"],
    ["email", "users_email"],
    "password",
  ]);
});
