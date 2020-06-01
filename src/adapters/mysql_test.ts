import { mysqlOptions } from "../testutils.ts";
import { MysqlAdapter } from "./mysql.ts";

Deno.test("MysqlAdapter: should connect to database and disconnect to database", async () => {
  const adapter = new MysqlAdapter(mysqlOptions);
  await adapter.connect();
  await adapter.disconnect();
});
