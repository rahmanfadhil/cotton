import { parse } from "https://deno.land/std@v0.58.0/flags/mod.ts";
import * as Colors from "https://deno.land/std@v0.58.0/fmt/colors.ts";
import { join } from "https://deno.land/std@v0.58.0/path/mod.ts";
import { readJson } from "https://deno.land/std@v0.58.0/fs/mod.ts";

import { MigrationRunner } from "./src/migrations/migrationrunner.ts";
import { connect } from "./src/connect.ts";

const CLI_VERSION = "v0.1.0";

const parsedArgs = parse(Deno.args);

const helps: { [key: string]: string } = {
  // Revert migration
  "migration:down": `${Colors.yellow("Description:")}
  Revert the last "batch" of migrations.

${Colors.yellow("Usage:")}
  migration:down [options]

${Colors.yellow("Options:")}
  ${Colors.green("--steps")}  The number of migrations to revert`,

  // Create new migration
  "migration:create": `${Colors.yellow("Description:")}
  Creates a new migration file

${Colors.yellow("Usage:")}
  migration:create [options]

${Colors.yellow("Options:")}
  ${Colors.green("-n, --name")}  The migration name`,

  // Apply available migrations
  "migration:up": `${Colors.yellow("Description:")}
  Apply all available migrations

${Colors.yellow("Usage:")}
  migration:up`,

  // Get migration info
  "migration:info": `${Colors.yellow("Description:")}
  Get the status of all migrations

${Colors.yellow("Usage:")}
  migration:info`,
};

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
  const redMessage = Colors.bgRed(errorMessage);
  console.log("\n" + redSpaces + "\n" + redMessage + "\n" + redSpaces);
  Deno.exit(1);
}

/**
 * Display all available commands and how to use them in the console.
 */
function help() {
  console.log(`Cotton CLI ${Colors.blue(CLI_VERSION)}

${Colors.yellow("Usage:")}
  cotton [command] [options]


${Colors.yellow("Options:")}
  ${Colors.green("-h, --help")}
    Prints help information
  ${Colors.green("-c, --config")}
    Set the location of your database configuration (default: "ormconfig.json")


${Colors.yellow("Commands:")}
  ${Colors.green("migration:create")}  Creates a new migration file
  ${Colors.green("migration:up")}      Apply all available migrations
  ${Colors.green("migration:down")}    Revert the last "batch" migrations
  ${Colors.green("migration:info")}    Get the status of all migrations`);
}

async function getMigrationsInfo(runner: MigrationRunner) {
  const migrations = await runner.getAllMigrations();

  const longestName = migrations.migrations
    .reduce((a, b) => a.name.length > b.name.length ? a : b).name;

  let migrationNameDashes = "";

  for (let i = 0; i < longestName.length; i++) {
    migrationNameDashes += "-";
  }

  console.log("Applied  Migration");
  console.log("-------  " + migrationNameDashes);

  for (const migration of migrations.migrations) {
    const isExecuted = migration.isExecuted
      ? Colors.green("Yes")
      : Colors.red("No ");

    console.log(`${isExecuted}      ${migration.name}`);
  }
}

console.log(parsedArgs);

if (parsedArgs._.length >= 1) {
  const command = parsedArgs._[0];

  if (parsedArgs.h || parsedArgs.help) {
    console.log(helps[command]);
  } else {
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

      switch (command) {
        case "migration:create":
          const name = parsedArgs.n || parsedArgs.name;
          if (typeof name === "string") {
            await runner.createMigrationFile(name);
          } else {
            error(`Migration must have a name!`);
          }

          break;
        case "migration:up":
          await runner.applyMigrations();
          break;
        case "migration:down":
          if (typeof parsedArgs.steps === "number" && parsedArgs.steps >= 1) {
            await runner.revertMigrations(parsedArgs.steps as number);
          } else {
            await runner.revertMigrations();
          }
          break;
        case "migration:info":
          await getMigrationsInfo(runner);
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
  }
} else {
  help();
}
