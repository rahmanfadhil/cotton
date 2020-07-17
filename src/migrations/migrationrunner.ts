import { Adapter } from "../adapters/adapter.ts";
import { Colors, joinPath } from "../../deps.ts";
import { Schema } from "./schema.ts";
import { Migration } from "./migration.ts";
import { createMigrationTimestamp } from "../utils/date.ts";

interface MigrationInfo {
  migration: Migration;
  name: string;
  isExecuted: boolean;
  batch: number;
}

/**
 * Run migration classes
 */
export class MigrationRunner {
  constructor(
    /** Migration files directory */
    private migrationDir: string,
    /** The database adapter to perform queries */
    private adapter: Adapter,
  ) {}

  /**
   * Create a new migration script
   * 
   * @param name the name of the migration
   */
  public async createMigrationFile(name: string): Promise<string> {
    if (!name.match(/^[A-Za-z]+$/)) {
      throw new Error(
        `Invalid name for migration '${name}', name can only contain letters!`,
      );
    }

    // Create the migrations folder if not exists
    await this.ensureMigrationDir();

    // Create a unique timestamps
    const timestamp = createMigrationTimestamp();

    // Generate the file name
    const fileName = `${this.migrationDir}/${timestamp + "_" + name}.ts`;

    // Write the file
    await Deno.writeTextFile(
      fileName,
      `import { Migration, Schema } from "https://deno.land/x/cotton/mod.ts";\n\nexport default class extends Migration {\n  async up(schema: Schema) {}\n\n  async down(schema: Schema) {}\n}`,
    );

    console.log(`${Colors.green("Created:")} ${fileName}`);

    return fileName;
  }

  /**
   * Get all migration classes
   */
  private async getAllMigrationFiles(): Promise<MigrationInfo[]> {
    const migrations: MigrationInfo[] = [];

    // Loop through all files
    for await (const file of Deno.readDir(this.migrationDir)) {
      if (file.isFile) {
        let MigrationClass: { new (): Migration };

        try {
          const fileContent = await import(
            joinPath(this.migrationDir, file.name)
          );

          if (!(fileContent.default.prototype instanceof Migration)) {
            throw new Error();
          }

          MigrationClass = fileContent.default;
        } catch {
          throw new Error(`Failed to load '${file.name}' migration class!`);
        }

        const migration = new MigrationClass();

        migrations.push({
          migration,
          name: file.name.split(".")[0],
          batch: 0,
          isExecuted: false,
        });
      }
    }

    return migrations.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  /**
   * Get all available migrations
   */
  public async getAllMigrations(): Promise<{
    migrations: MigrationInfo[];
    lastBatch: number;
  }> {
    await this.createMigrationsTable();

    const migrations = await this.adapter
      .table("migrations")
      .select("name", "batch")
      .execute<{ name: string; batch: number }>();
    const migrationFiles = await this.getAllMigrationFiles();

    for (const migration of migrations) {
      const migrationIndex = migrationFiles.findIndex((item) =>
        item.name === migration.name
      );
      if (migrationIndex === -1) {
        throw new Error(`Migration '${migration.name}' is missing!`);
      }

      migrationFiles[migrationIndex].isExecuted = true;
      migrationFiles[migrationIndex].batch = migration.batch;
    }

    const lastBatch = migrationFiles.reduce((prev, current) =>
      (prev.batch > current.batch) ? prev : current
    );

    return {
      migrations: migrationFiles,
      lastBatch: lastBatch.batch,
    };
  }

  /**
   * Execute a new batch of migrations
   */
  public async applyMigrations() {
    const { migrations, lastBatch } = await this.getAllMigrations();

    for (const migration of migrations) {
      if (!migration.isExecuted) {
        try {
          console.log(`${Colors.yellow("Migrating:")} ${migration.name}`);
          await migration.migration.up(new Schema(this.adapter));
          await this.adapter
            .table("migrations")
            .insert({ name: migration.name, batch: lastBatch + 1 })
            .execute();
          console.log(`${Colors.green("Migrated:")}  ${migration.name}`);
        } catch {
          throw new Error(`Failed to apply migration '${migration.name}'!`);
        }
      }
    }
  }

  /**
   * Revert executed migrations from the last batch
   * 
   * @param steps the number of migrations you want to revert
   */
  public async revertMigrations(steps?: number) {
    let { migrations, lastBatch } = await this.getAllMigrations();

    if (typeof steps === "number" && migrations.length) {
      migrations = migrations.slice(Math.max(migrations.length - steps, 0));
    } else if (lastBatch > 0) {
      migrations = migrations.filter((migration) =>
        migration.batch === lastBatch
      );
    } else {
      throw new Error("No migration to revert!");
    }

    for (const migration of migrations) {
      try {
        console.log(`${Colors.yellow("Reverting:")} ${migration.name}`);
        await migration.migration.down(new Schema(this.adapter));
        await this.adapter
          .table("migrations")
          .where("name", migration.name)
          .delete()
          .execute();
        console.log(`${Colors.green("Reverted:")}  ${migration.name}`);
      } catch {
        throw new Error(`Failed to revert migration '${migration.name}'!`);
      }
    }
  }

  /**
   * Create the `migrations` table if it doesn't exist yet
   */
  public async createMigrationsTable() {
    const schema = new Schema(this.adapter);
    if (!await schema.hasTable("migrations")) {
      await schema.createTable("migrations", (table) => {
        table.id();
        table.varchar("name", 255).unique().notNull();
        table.integer("batch").notNull();
      });
      console.log(`${Colors.green("Migration table created successfully!")}`);
    }
  }
  /**
   * Ensures that the migration directory exists.
   * If the directory structure does not exist, it is created. Like mkdir -p.
   * Requires the `--allow-read` and `--allow-write` flag.
   */
  public async ensureMigrationDir(): Promise<void> {
    try {
      const fileInfo = await Deno.lstat(this.migrationDir);
      if (!fileInfo.isDirectory) throw null;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound || err === null) {
        // if dir not exists. then create it.
        await Deno.mkdir(this.migrationDir, { recursive: true });
        return;
      }

      throw err;
    }
  }
}
