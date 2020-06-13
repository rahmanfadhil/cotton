import { COLUMN_TYPES } from "../constants.ts";
import { ColumnDefinition } from "./columndefinition.ts";
import { Adapter } from "../adapters/adapter.ts";

export interface CreateTableOptions {
  createIfNotExists?: boolean;
}

/**
 * The table builder
 */
export class TableBuilder {
  private options: Required<CreateTableOptions>;
  private columns: ColumnDefinition[] = [];

  constructor(
    /** Table name on the database */
    private tableName: string,
    /** The database adapter */
    private adapter: Adapter,
    /** Other options */
    options?: CreateTableOptions,
  ) {
    // Populate `this.options` with default
    this.options = Object.assign({}, { createIfNotExists: false }, options);
  }

  /** Add column */
  public addColumn(column: ColumnDefinition) {
    this.columns.push(column);
    return this;
  }

  /**
   * Generate SQL statement for creating the table
   */
  public toSQL(): string {
    const sql = [`create table`];

    if (this.options.createIfNotExists) {
      sql.push("if not exists");
    }

    // Set the table names
    sql.push(this.tableName);

    // Contains table columns definition
    const columns: string[] = [];

    for (const column of this.columns) {
      // Set the column name and its type (for a specific database dialect)
      let sizeStr = "";
      if (
        COLUMN_TYPES[column.type][this.adapter.type] == "varchar" &&
        !column.size
      ) {
        sizeStr = "(2048)";
      }
      const columnSQL = [
        `${column.name} ${
          COLUMN_TYPES[column.type][this.adapter.type]
        }${sizeStr}`,
      ];

      if (column.primaryKey) {
        columnSQL.push("primary key");
      }

      if (column.notNull) {
        columnSQL.push("not null");
      }

      // In sqlite and mysql, we need to explicitly call AUTO_INCREMENT or AUTOINCREMENT
      // to enable the auto increment feature. Unlike postgres which only uses SERIAL type.
      if (
        column.autoIncrement &&
        (this.adapter.type === "mysql" || this.adapter.type === "sqlite")
      ) {
        // Get database specific column type for auto increment
        columnSQL.push(
          this.adapter.type === "mysql" ? "auto_increment" : "autoincrement",
        );
      }

      columns.push(columnSQL.join(" "));
    }

    // Add column definitions to the statement
    sql.push(`(${[...columns].join(", ")})`);

    return sql.join(" ") + ";";
  }

  public async execute(): Promise<void> {
    await this.adapter.query(this.toSQL());
  }
}
