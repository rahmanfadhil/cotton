import { Adapter } from "../adapters/adapter.ts";
import { Migration } from "./migration.ts";
import { walk, writeFileStr, ensureDir } from "../../deps.ts";
import { TableInfo } from "./tableinfo.ts";
import { Schema } from "./schema.ts";

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
   */
  public async createMigrationFile(name: string): Promise<string> {
    // Create the migrations folder if not exists
    await ensureDir(this.migrationDir);

    // Generate the class name
    const className = name + "_" + Date.now();

    // Generate the file name
    const fileName = `${this.migrationDir}/${className}.ts`;

    // Write the file
    await writeFileStr(
      fileName,
      `import { Migration, Schema } from "https://deno.land/x/cotton/mod.ts";\n\nexport class ${className} extends Migration {\n  async up(schema: Schema) {}\n\n  async down(schema: Schema) {}\n}`,
    );

    return fileName;
  }

  /**
   * Get all migration classes
   */
  public async getAllMigrations() {
    const migrations: {
      migration: Migration;
      name: string;
      timestamp: number;
      isExecuted: boolean;
    }[] = [];

    // Loop through all files
    for await (const file of walk(this.migrationDir)) {
      if (file.isFile) {
        const className = file.name.split(".")[0];
        let MigrationClass: { new (): Migration };

        try {
          const fileContent = await import(file.path);

          if (
            !fileContent[className] ||
            !(fileContent[className].prototype instanceof Migration)
          ) {
            throw new Error();
          }

          MigrationClass = fileContent[className];
        } catch {
          throw new Error(`Failed to load '${file.name}' migration class!`);
        }

        const migration = new MigrationClass();
        const [name, timestamp] = file.name.split("_");

        migrations.push({
          migration,
          name,
          timestamp: parseInt(timestamp),
          isExecuted: false,
        });
      }
    }

    return migrations;
  }

  /**
   * Create the `migrations` table if it doesn't exist yet
   */
  public async createMigrationsTable() {
    const tableInfo = new TableInfo("migrations", this.adapter);
    if (await tableInfo.exists()) {
      const schema = new Schema(this.adapter);
      await schema.createTable("migrations", (table) => {
        table.id();
        table.string("name", 255, { notNull: true });
        table.bigInteger("timestamp", { notNull: true });
      });
    }
  }
}
