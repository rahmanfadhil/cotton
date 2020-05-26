import { ConnectionOptions, BaseAdapter } from "./baseadapter.ts";

import { MysqlAdapter } from "./adapter/mysql.ts";
import { PostgresAdapter } from "./adapter/postgres.ts";
import { SqliteAdapter } from "./adapter/sqlite.ts";

interface ConnectionConfig extends ConnectionOptions {
  type: "mysql" | "postgres" | "sqlite";
}

/**
 * Connect to database and automatically chose the driver
 * 
 * @param options Connection options
 */
export async function connect(
  options: ConnectionConfig,
): Promise<BaseAdapter> {
  let adapter: BaseAdapter;

  switch (options.type) {
    case "mysql":
      adapter = new MysqlAdapter(options);
      break;
    case "postgres":
      adapter = new PostgresAdapter(options);
      break;
    case "sqlite":
      adapter = new SqliteAdapter(options);
      break;
    default:
      throw new Error("Database type invalid!");
  }

  await adapter.connect();

  return adapter;
}
