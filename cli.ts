import { parseFlags, Colors, joinPath } from "./deps.ts";

import { connect, MigrationRunner } from "./mod.ts";

const CLI_VERSION = "v0.1.1";
const COTTON_VERSION = "v0.7.0";

const parsedArgs = parseFlags(Deno.args);

/**
 * Instructions for all available commands
 */
const helps: { [key: string]: string } = {
  // Revert migration
  "migration:down": `${Colors.yellow("Description:")}
  Rollback the migrations.

  By default, this will rollback the latest "batch"
  of migrations. However, you can still customize
  how many migrations you want to rollback by using
  the ${Colors.green("--steps")} option.

${Colors.yellow("Usage:")}
  migration:down [options]

${Colors.yellow("Options:")}
  ${Colors.green("--steps")}  The number of migrations to revert`,

  // Create new migration
  "migration:create": `${Colors.yellow("Description:")}
  Creates a new migration file.

  You need to provide a name for your migration using
  the ${Colors.green("--name")} options.

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

if (parsedArgs._.length >= 1) {
  const command = parsedArgs._[0];

  if (parsedArgs.h || parsedArgs.help) {
    console.log(helps[command]);
  } else {
    try {
      const configPath = parsedArgs.config as string ||
        parsedArgs.c as string || "./ormconfig.json";

      // Connect to the database
      const adapter = await connect(configPath);

      // Create new migration runner
      const runner = new MigrationRunner(
        joinPath(Deno.cwd(), "./migrations"),
        adapter,
        COTTON_VERSION,
      );

      // Do something with the command
      if (command === "migration:create") {
        const name = parsedArgs.n || parsedArgs.name;
        if (typeof name === "string") {
          await runner.createMigrationFile(name);
        } else {
          error(`Migration must have a name!`);
        }
      } else if (command === "migration:up") {
        await runner.applyMigrations();
      } else if (command === "migrations:down") {
        if (typeof parsedArgs.steps === "number" && parsedArgs.steps >= 1) {
          await runner.revertMigrations(parsedArgs.steps as number);
        } else {
          await runner.revertMigrations();
        }
      } else if (command === "migration:info") {
        await getMigrationsInfo(runner);
      } else {
        error(`Command "${command}" is not available!`);
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
