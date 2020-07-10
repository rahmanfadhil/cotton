import { parse } from "https://deno.land/std@v0.58.0/flags/mod.ts";
import * as Colors from "https://deno.land/std@v0.58.0/fmt/colors.ts";
import { join } from "https://deno.land/std@v0.58.0/path/mod.ts";
import { readJson } from "https://deno.land/std@v0.58.0/fs/mod.ts";

import { MigrationRunner } from "./src/migrations/migrationrunner.ts";
import { connect } from "./src/connect.ts";

const CLI_VERSION = "v0.1.0";

const parsedArgs = parse(Deno.args);

/**
 * Print an error to the console
 * 
 * @param message the error message
 */
function error(message: string) {
  const errorMessage = `  ${message}  `;
  const redSpaces = Colors.bgRed(
    errorMessage.split("").map(() => " ").join(""),
  );
  const redMessage = Colors.bgRed(Colors.white(errorMessage));
  console.log("\n" + redSpaces + "\n" + redMessage + "\n" + redSpaces);
}

/**
 * Display all available commands and how to use them in the console.
 */
function help() {
  console.log(`Cotton CLI ${Colors.yellow(CLI_VERSION)}

${Colors.green("Usage:")}
  command [options] [arguments]

${Colors.green("Commands:")}
  migration:create
  migration:up
  migration:down`);
}

console.log(parsedArgs);

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
    // const migrations = await runner.getAllMigrations();
    // console.log(migrations);

    switch (command) {
      case "migration:create":
        if (parsedArgs.n) {
          await runner.createMigrationFile(parsedArgs.n);
        } else {
          error(`Migration must have a name!`);
        }

        break;
      case "migration:up":
        console.log(await runner.applyMigrations());
        break;
      case "migration:down":
        console.log(await runner.revertMigrations());
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
