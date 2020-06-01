import { PostgresAdapter } from "./postgres.ts";
import { postgresOptions } from "../testutils.ts";

Deno.test("PostgresAdapter: should connect to database and disconnect to database", async () => {
  const adapter = new PostgresAdapter(postgresOptions);
  await adapter.connect();
  await adapter.disconnect();
});
