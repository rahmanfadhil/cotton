import { Foreign, ForeignActions } from "./foreign.ts";
import { assertEquals } from "../../testdeps.ts";

Deno.test("Foreign: `toSQL` should create a full foreign key definition", () => {
  const foreign = new Foreign({
    columns: ["user_id"],
    referencedTableName: "users",
    referencedColumns: ["id"],
    constraint: "FK_MyConstraint",
    onDelete: ForeignActions.Cascade,
    onUpdate: ForeignActions.SetNull,
  });

  assertEquals(
    foreign.toSQL("mysql"),
    "CONSTRAINT `FK_MyConstraint` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE SET NULL",
  );
  assertEquals(
    foreign.toSQL("postgres"),
    'CONSTRAINT "FK_MyConstraint" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE SET NULL',
  );
  assertEquals(
    foreign.toSQL("sqlite"),
    "CONSTRAINT `FK_MyConstraint` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE SET NULL",
  );
});

Deno.test("Foreign: `toSQL` should create a basic foreign key definition", () => {
  const foreign = new Foreign({
    columns: ["user_id"],
    referencedTableName: "users",
    referencedColumns: ["id"],
  });

  assertEquals(
    foreign.toSQL("mysql"),
    "FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)",
  );
  assertEquals(
    foreign.toSQL("postgres"),
    'FOREIGN KEY ("user_id") REFERENCES "users"("id")',
  );
  assertEquals(
    foreign.toSQL("sqlite"),
    "FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)",
  );
});

Deno.test("Foreign: `ForeignActions` should have the valid SQL actions", () => {
  assertEquals(ForeignActions.Cascade, "CASCADE");
  assertEquals(ForeignActions.NoAction, "NO ACTION");
  assertEquals(ForeignActions.Restrict, "RESTRICT");
  assertEquals(ForeignActions.SetNull, "SET NULL");
});
