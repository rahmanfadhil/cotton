import { quote } from "../utils/dialect.ts";
import type { DatabaseDialect } from "../connect.ts";

/** Foreign key actions for ON DELETE and ON UPDATE */
export enum ForeignActions {
  Cascade = "CASCADE",
  SetNull = "SET NULL",
  NoAction = "NO ACTION",
  Restrict = "RESTRICT",
}

/** Options for a foreign key */
export interface ForeignOptions {
  /** The column names */
  columns: string[];

  /** A custom constraint name (optional) */
  constraint?: string;

  /** Column names you want to reference on the other side of the table */
  referencedColumns: string[];

  /** The name of the table you want to reference */
  referencedTableName: string;

  /** What to do when the record is removed? */
  onDelete?: ForeignActions;

  /** What to do when the record is updated? */
  onUpdate?: ForeignActions;
}

/**
 * Define a database foreign key 
 */
export class Foreign {
  constructor(
    /** Options for this foreign key */
    private options: ForeignOptions,
  ) {}

  /**
   * Generate the definition query for this foreign key.
   */
  public toSQL(dialect: DatabaseDialect) {
    const query: string[] = [];

    // Add the custom constraint name if exists.
    if (this.options.constraint) {
      query.push(`CONSTRAINT ${quote(this.options.constraint, dialect)}`);
    }

    // The user must provide at least one column
    if (!this.options.columns) {
      throw new Error("Cannot add a foreign key without any columns!");
    }

    // Add the columns
    const columns = this.options.columns
      .map((column) => quote(column, dialect))
      .join(", ");
    query.push(`FOREIGN KEY (${columns})`);

    // The user must reference at least one column
    if (!this.options.referencedColumns) {
      throw new Error(
        "Cannot add a foreign key without referencing any columns!",
      );
    }

    // The user must reference a table name
    if (!this.options.referencedTableName) {
      throw new Error("You must provide a table name for a foreign key!");
    }

    // Add the referenced columns
    const references = this.options.referencedColumns
      .map((column) => quote(column, dialect))
      .join(", ");
    const tableName = quote(this.options.referencedTableName, dialect);
    query.push(`REFERENCES ${tableName}(${references})`);

    // Add the ON DELETE action if exists
    if (this.options.onDelete) {
      query.push(`ON DELETE ${this.options.onDelete}`);
    }

    // Add the ON UPDATE action if exists
    if (this.options.onUpdate) {
      query.push(`ON UPDATE ${this.options.onUpdate}`);
    }

    return query.join(" ");
  }
}
