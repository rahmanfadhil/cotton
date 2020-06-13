import { ColumnDefinition } from "./columndefinition.ts";

/**
 * Alter a table
 */
export class TableUpdater {
  /** Create an index */
  public addIndex(index: string) {
    throw new Error("Not implemented yet!");
  }

  /** Remove an index */
  public removeIndex(index: string) {
    throw new Error("Not implemented yet!");
  }

  /** Rename a column */
  public renameColumn(column: string, newColumn: string) {
    throw new Error("Not implemented yet!");
  }

  /** Create a new column */
  public addColumn(index: string) {
    throw new Error("Not implemented yet!");
  }

  /** Update a columm */
  public updateColumn(column: string, newColumn: ColumnDefinition) {
    throw new Error("Not implemented yet!");
  }

  /** Remove a columm */
  public removeColumm(column: string) {
    throw new Error("Not implemented yet!");
  }
}
