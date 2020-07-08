import { Adapter } from "../adapters/adapter.ts";
import { walk, writeFileStr, ensureDir } from "../../deps.ts";
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
    await ensureDir(this.migrationDir);

    // Create a unique timestamps
    const timestamp = createMigrationTimestamp();

    // Generate the file name
    const fileName = `${this.migrationDir}/${timestamp + "_" + name}.ts`;

    // Write the file
    await writeFileStr(
      fileName,
      `import { Migration, Schema } from "https://deno.land/x/cotton/mod.ts";\n\nexport default class extends Migration {\n  async up(schema: Schema) {}\n\n  async down(schema: Schema) {}\n}`,
    );

    return fileName;
  }

  /**
   * Get all migration classes
   */
  private async getAllMigrationFiles(): Promise<MigrationInfo[]> {
    const migrations: MigrationInfo[] = [];

    // Loop through all files
    for await (const file of walk(this.migrationDir)) {
      if (file.isFile) {
        let MigrationClass: { new (): Migration };

        try {
          const fileContent = await import(file.path);

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

    return migrations;
  }

  /**
   * Get all available migrations
   */
  public async getAllMigrations(): Promise<MigrationInfo[]> {
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
      if (!migrationIndex) {
        throw new Error(`Migration '${migration.name}' is missing!`);
      }

      migrationFiles[migrationIndex].isExecuted = true;
      migrationFiles[migrationIndex].batch = migration.batch;
    }

    return migrationFiles;
  }

  /**
   * Create the `migrations` table if it doesn't exist yet
   */
  public async createMigrationsTable() {
    const schema = new Schema(this.adapter);
    if (!await schema.hasTable("migrations")) {
      await schema.createTable("migrations", (table) => {
        table.id();
        table.varchar("name", 255).notNull();
        table.integer("batch").notNull();
      });
    }
  }
}
