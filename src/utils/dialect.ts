import type { DatabaseDialect } from "../connect.ts";

/**
 * Wrap a table or column name with backticks or
 * double quotes depending on the database dialect.
 * 
 * @param name the table or column name to be wrapped
 * @param dialect the database dialect
 */
export function quote(name: string, dialect: DatabaseDialect): string {
  if (name === "*") {
    return name;
  }

  switch (dialect) {
    case "postgres":
      return `"${name}"`;
    case "mysql":
    case "sqlite":
    default:
      return `\`${name}\``;
  }
}
