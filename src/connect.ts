import type { ConnectionOptions, Adapter } from "./adapters/adapter.ts";
import { joinPath } from "../deps.ts";

import { MysqlAdapter } from "./adapters/mysql.ts";
import { PostgresAdapter } from "./adapters/postgres.ts";
import { SqliteAdapter } from "./adapters/sqlite.ts";
import { ObjectType, BaseModel } from "./basemodel.ts";

export type DatabaseDialect = "mysql" | "postgres" | "sqlite";

interface ConnectionConfig extends ConnectionOptions {
  type: DatabaseDialect;
  models?: ObjectType<BaseModel>[];
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
      const path = joinPath(Deno.cwd(), options ? options : "./ormconfig.json");
      const decoder = new TextDecoder("utf-8");
      const result = decoder.decode(await Deno.readFile(path));

      // TODO: validate connection options
      connectionOptions = JSON.parse(result) as any;
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

  if (Array.isArray(connectionOptions.models)) {
    for (let i = 0; i < connectionOptions.models.length; i++) {
      if (connectionOptions.models[i].prototype instanceof BaseModel) {
        (connectionOptions.models[i] as any).manager = adapter.getManager();
      }
    }
  }

  await adapter.connect();

  return adapter;
}
