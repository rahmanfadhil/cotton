import { parse } from "https://deno.land/std@v0.58.0/flags/mod.ts";
import * as Colors from "https://deno.land/std@v0.58.0/fmt/colors.ts";
import { join } from "https://deno.land/std@v0.58.0/path/mod.ts";
import { readJson } from "https://deno.land/std@v0.58.0/fs/mod.ts";

import { MigrationRunner } from "./src/migrations/migrationrunner.ts";
import { connect } from "./src/connect.ts";

const CLI_VERSION = "v0.1.0";

const parsedArgs = parse(Deno.args);

function error(message: string) {
  const errorMessage = `  ${message}  `;
  const redSpaces = Colors.bgRed(
    errorMessage.split("").map(() => " ").join(""),
  );
  const redMessage = Colors.bgRed(Colors.white(errorMessage));
  console.log("\n" + redSpaces + "\n" + redMessage + "\n" + redSpaces);
}

function help() {
  console.log(`Cotton CLI ${Colors.yellow(CLI_VERSION)}

${Colors.green("Usage:")}
  command [options] [arguments]

${Colors.green("Commands:")}
  migration:create
  migration:up
  migration:down`);
}

if (parsedArgs._.length >= 1) {
  const command = parsedArgs._[0];

  try {
    // Validate connection options
    const connectionOptions = await readJson("./ormconfig.json");

    // Connect to the database
    const adapter = await connect(connectionOptions as any);

    // Create new migration runner
    const runner = new MigrationRunner(
      join(Deno.cwd(), "./migrations"),
      adapter,
    );

    // Get all available migrations from the migrations folder
    const migrations = await runner.getAllMigrations();

    switch (command) {
      case "migration:create":
        if (parsedArgs.n) {
          runner.createMigrationFile(parsedArgs.n);
        } else {
          error(`Command "${command}" is not available!`);
        }

        break;
      case "migration:up":
        await runner.createMigrationsTable();
        console.log(migrations);
        break;
      case "migration:down":
        await runner.createMigrationsTable();
        console.log(migrations);
        break;
      default:
        error(`Command "${command}" is not available!`);
        break;
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      error("Configuration file not found!");
    } else {
      error(err.message);
    }
  }
} else {
  help();
}
