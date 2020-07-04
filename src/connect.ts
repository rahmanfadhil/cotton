import { ConnectionOptions, Adapter } from "./adapters/adapter.ts";

import { MysqlAdapter } from "./adapters/mysql.ts";
import { PostgresAdapter } from "./adapters/postgres.ts";
import { SqliteAdapter } from "./adapters/sqlite.ts";

export type DatabaseDialect = "mysql" | "postgres" | "sqlite";

interface ConnectionConfig extends ConnectionOptions {
  type: DatabaseDialect;
}

/**
 * Connect to database and automatically chose the driver
 * 
 * @param options Connection options
 */
export async function connect(
  options: ConnectionConfig,
): Promise<Adapter> {
  let adapter: Adapter;

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
