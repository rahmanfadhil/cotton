import { Adapter } from "../adapters/adapter.ts";
import { Migration } from "./migration.ts";
import { walk, writeFileStr, ensureDir } from "../../deps.ts";
import { Schema } from "./schema.ts";

interface MigrationInfo {
  migration: Migration;
  name: string;
  timestamp: number;
  isExecuted: boolean;
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
  public async getAllMigrations(): Promise<MigrationInfo[]> {
    const migrations: MigrationInfo[] = [];

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
    const schema = new Schema(this.adapter);
    if (await schema.hasTable("migrations")) {
      await schema.createTable("migrations", (table) => {
        table.id();
        table.varchar("name", 255).notNull();
        table.bigInteger("timestamp").notNull();
      });
    }
  }
}
