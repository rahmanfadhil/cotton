import { COLUMN_TYPES } from "../constants.ts";
import { DatabaseDialect } from "../connect.ts";

/**
 * Represents a table column for Schema
 */
export class Column {
  private isPrimaryKey: boolean = false;
  private isNotNull: boolean = false;
  private isUnique: boolean = false;
  private defaultValue: any;
  private isDefaultValueAnExpression = false;

  constructor(
    /** The column name */
    private name: string,
    /** The column type */
    private type: keyof typeof COLUMN_TYPES,
    /** The column length (varchar only) */
    private length?: number,
  ) {}

  /** Set this column to be the PRIMARY KEY */
  public primary(): Column {
    this.isPrimaryKey = true;
    return this;
  }

  /** Add the NOT NULL constraint */
  public notNull(): Column {
    this.isNotNull = true;
    return this;
  }

  /** Add the UNIQUE constraint */
  public unique(): Column {
    this.isUnique = true;
    return this;
  }

  /**
   * Set the default value of this column
   * 
   * @param value the default value of the column
   * @param isExpression wether the value is an SQL expression or not (default false)
   */
  public default(value: any, isExpression: boolean = false) {
    this.defaultValue = value;
    this.isDefaultValueAnExpression = isExpression;
    return this;
  }

  /**
   * Generate the SQL column definition
   * 
   * @param dialect the database dialect which you currently using
   */
  public toSQL(dialect: DatabaseDialect): string {
    // If the type is VARCHAR, set the length
    let lengthStr = "";
    if (COLUMN_TYPES[this.type][dialect] == "varchar") {
      lengthStr = typeof this.length === "undefined"
        ? "(255)"
        : `(${this.length})`;
    }

    // Set the column name and its type (for a specific database dialect)
    const columnType = COLUMN_TYPES[this.type][dialect].toUpperCase();
    const query = [`${this.getColumnName(dialect)} ${columnType}${lengthStr}`];

    // Add the PRIMARY KEY
    if (this.isPrimaryKey) {
      query.push("PRIMARY KEY");
    }

    // Add the NOT NULL constraint if exists
    if (this.isNotNull) {
      query.push("NOT NULL");
    }

    // Add the UNIQUE constraint if exists
    if (this.isUnique) {
      query.push("UNIQUE");
    }

    // Check if the type is auto increment
    const isIncrement = this.type === "increments" ||
      this.type === "smallIncrements" || this.type === "bigIncrements";

    // In sqlite and mysql, we need to explicitly call AUTO_INCREMENT or AUTOINCREMENT
    // to enable the auto increment feature. Unlike postgres which only uses SERIAL type.
    if (
      isIncrement &&
      (dialect === "mysql" || dialect === "sqlite")
    ) {
      // Get database specific column type for auto increment
      query.push(
        dialect === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT",
      );
    }

    // Add the default value
    const defaultValue = this.getDefaultValueSQL(dialect);
    if (defaultValue) {
      query.push(defaultValue);
    }

    return query.join(" ");
  }

  /** Get the default value text of the column */
  private getDefaultValueSQL(dialect: DatabaseDialect): string | null {
    if (this.defaultValue === null) {
      return "DEFAULT NULL";
    } else if (typeof this.defaultValue === "boolean") {
      if (dialect === "sqlite" || dialect === "mysql") {
        return `DEFAULT ${this.defaultValue ? 1 : 0}`;
      } else {
        return `DEFAULT ${this.defaultValue ? "true" : "false"}`;
      }
    } else if (typeof this.defaultValue === "number") {
      return `DEFAULT ${this.defaultValue}`;
    } else if (typeof this.defaultValue === "string") {
      const value = this.isDefaultValueAnExpression
        ? this.defaultValue
        : `'${this.defaultValue}'`;
      return `DEFAULT ${value}`;
    } else {
      return null;
    }
  }

  public getColumnName(dialect: DatabaseDialect): string {
    switch (dialect) {
      case "postgres":
        return `"${this.name}"`;
      case "mysql":
      case "sqlite":
      default:
        return `\`${this.name}\``;
    }
  }
}
