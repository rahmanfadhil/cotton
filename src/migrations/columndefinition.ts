import { COLUMN_TYPES } from "../constants.ts";

export interface ColumnDefinition {
  type: keyof typeof COLUMN_TYPES;
  name: string;
  primaryKey?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
  size?: number;
  unique?: boolean;
}
