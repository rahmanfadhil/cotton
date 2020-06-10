import { COLUMN_TYPES } from "./constants.ts";
import { Adapter, QueryResult, QueryOptions } from "./adapters/adapter.ts";

interface ColumnDefinition {
  type: keyof typeof COLUMN_TYPES;
  name: string;
  primaryKey?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
}

interface TableOptions {
  dialect: "mysql" | "postgres" | "sqlite";
  createIfNotExists?: boolean;
}

/**
 * A representation of a single table in database
 */
export class TableBuilder {
  private options: Required<TableOptions>;
  private columns: ColumnDefinition[] = [];

  constructor(
    /** Table name on the database */
    private tableName: string,
    /** Adapter */
    private adapter?: Adapter,
    /** Other options */
    options?: TableOptions,
  ) {
    // Populate `this.options` with default
    this.options = Object.assign({}, { createIfNotExists: false }, options);
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
      const columnSQL = [
        `${column.name} ${COLUMN_TYPES[column.type][this.options.dialect]}`,
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
        (this.options.dialect === "mysql" || this.options.dialect === "sqlite")
      ) {
        // Get database specific column type for auto increment
        columnSQL.push(
          this.options.dialect === "mysql" ? "auto_increment" : "autoincrement",
        );
      }

      columns.push(columnSQL.join(" "));
    }

    // Add column definitions to the statement
    sql.push(`(${[...columns].join(", ")})`);

    return sql.join(" ") + ";";
  }

  addField(field: ColumnDefinition) {
    this.columns.push(field);
    return this;
  }

  /**
   * Execute query to create table.
   * 
   * @param adapter Custom database adapter
   */
  public async execute(
    options?: { adapter?: Adapter } & QueryOptions,
  ): Promise<QueryResult<any>> {
    let currentAdapter = options?.adapter || this.adapter;

    if (!currentAdapter) {
      throw new Error("Cannot run query, adapter is not provided!");
    }

    return await currentAdapter.query(this.toSQL(), options);
  }
}
