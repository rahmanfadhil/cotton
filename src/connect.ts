import { ConnectionOptions, Adapter } from "./adapters/adapter.ts";
import { joinPath, readJson } from "../deps.ts";

import { MysqlAdapter } from "./adapters/mysql.ts";
import { PostgresAdapter } from "./adapters/postgres.ts";
import { SqliteAdapter } from "./adapters/sqlite.ts";

export type DatabaseDialect = "mysql" | "postgres" | "sqlite";

interface ConnectionConfig extends ConnectionOptions {
  type: DatabaseDialect;
}

/**
 * Connect to database and automatically chose the driver
 */
export async function connect(): Promise<Adapter>;

/**
 * Connect to database and automatically chose the driver
 *
 * @param options Connection options
 */
export async function connect(options: ConnectionConfig): Promise<Adapter>;

/**
 * Connect to database and automatically chose the driver
 *
 * @param filePath Path to the database configuration file (default: "ormconfig.json")
 */
export async function connect(filePath: string): Promise<Adapter>;

/**
 * Connect to database and automatically chose the driver
 *
 * @param options Connection options
 */
export async function connect(
  options?: ConnectionConfig | string,
): Promise<Adapter> {
  let adapter: Adapter;

  let connectionOptions: ConnectionConfig;

  // If connections options is not provided, look up for "ormconfig.json" file.
  if (!options || typeof options === "string") {
    try {
      // TODO: validate the file content
      connectionOptions = await readJson(
        joinPath(Deno.cwd(), options ? options : "./ormconfig.json"),
      ) as any;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        throw new Error(
          "Cannot connect to database without connection options!",
        );
      } else {
        throw err;
      }
    }
  } else {
    connectionOptions = options;
  }

  switch (connectionOptions.type) {
    case "mysql":
      adapter = new MysqlAdapter(connectionOptions);
      break;
    case "postgres":
      adapter = new PostgresAdapter(connectionOptions);
      break;
    case "sqlite":
      adapter = new SqliteAdapter(connectionOptions);
      break;
    default:
      throw new Error("Database type invalid!");
  }

  await adapter.connect();

  return adapter;
}
