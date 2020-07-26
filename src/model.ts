import { Reflect } from "./utils/reflect.ts";
import { metadata } from "./constants.ts";

// --------------------------------------------------------------------------------
// MODELS
// --------------------------------------------------------------------------------

/**
 * Define a class as a database model.
 * 
 * @param tableName a custom table name for this model
 */
export function Model(tableName?: string) {
  return (target: Function) => {
    Reflect.defineMetadata(
      metadata.tableName,
      tableName || target.name.toLowerCase(),
      target,
    );
  };
}

// --------------------------------------------------------------------------------
// COLUMNS
// --------------------------------------------------------------------------------

/**
 * Transform database value to JavaScript types
 */
export enum ColumnType {
  String = "string",
  Date = "date",
  Number = "number",
  Boolean = "boolean",
}

/**
 * Information about table the table column
 */
export interface ColumnOptions {
  /** JavaScript type which will be converted from the database */
  type: ColumnType;

  /** The column name on the database */
  name: string;

  /** The default value */
  default?: any;
}

export type ColumnDescription = ColumnOptions & {
  propertyKey: string;
  isPrimaryKey: boolean;
};

function getColumnType(type: any): ColumnType | null {
  if (type === String) {
    return ColumnType.String;
  } else if (type === Number) {
    return ColumnType.Number;
  } else if (type === Date) {
    return ColumnType.Date;
  } else if (type === Boolean) {
    return ColumnType.Boolean;
  } else {
    return null;
  }
}

/**
 * Model field
 * 
 * @param options field options
 */
export function Column(options?: Partial<ColumnOptions>) {
  return (target: Object, propertyKey: string) => {
    let columns: ColumnDescription[] = [];
    if (Reflect.hasMetadata(metadata.columns, target)) {
      columns = Reflect.getMetadata(metadata.columns, target);
    }

    const columnTypeMetadata = Reflect.getMetadata(
      "design:type",
      target,
      propertyKey,
    );
    const columnType = getColumnType(columnTypeMetadata);
    if (!columnType) {
      throw new Error(
        `Column '${propertyKey}' must have a type!`,
      );
    }

    const description: ColumnDescription = Object.assign({}, {
      propertyKey: propertyKey,
      name: propertyKey,
      type: columnType,
      isPrimaryKey: false,
    }, options);

    columns.push(description);

    Reflect.defineMetadata(metadata.columns, columns, target);
  };
}

/** Options for model's primary field */
export interface PrimaryFieldOptions {
  name: string;
}

/**
 * Model primary key field
 *
 * @param options primary field options
 */
export function Primary(options?: PrimaryFieldOptions) {
  return (target: Object, propertyKey: string) => {
    let columns: ColumnDescription[] = [];
    if (Reflect.hasMetadata(metadata.columns, target)) {
      columns = Reflect.getMetadata(metadata.columns, target);
    }

    columns.push({
      propertyKey,
      name: options?.name || "id",
      type: ColumnType.Number,
      isPrimaryKey: true,
    });

    Reflect.defineMetadata(metadata.columns, columns, target);
  };
}

// --------------------------------------------------------------------------------
// RELATIONSHIPS
// --------------------------------------------------------------------------------

export enum RelationType {
  HasMany = 1,
  BelongsTo = 2,
}

export interface RelationDescription {
  propertyKey: string;
  type: RelationType;
  getModel: () => { new (): any };
  targetColumn: string;
}

/**
 * Define a "belongs to" relational property.
 * 
 * @param getModel a callback function that returns the model associated with this relation.
 * @param column the column name that being targetted in this relation.
 */
export function BelongsTo(
  getModel: () => { new (): any },
  column: string,
) {
  return (target: Object, propertyKey: string) => {
    addRelation(target, RelationType.BelongsTo, propertyKey, getModel, column);
  };
}

/**
 * Define a "has many" relational property.
 * 
 * @param getModel a callback function that returns the model associated with this relation.
 * @param column the column name that being targetted in this relation.
 */
export function HasMany(
  getModel: () => { new (): any },
  column: string,
) {
  return (target: Object, propertyKey: string) => {
    addRelation(target, RelationType.HasMany, propertyKey, getModel, column);
  };
}

/**
 * Add relation metadata to a targetted model.
 */
function addRelation(
  target: Object,
  type: RelationType,
  propertyKey: string,
  getModel: () => any,
  targetColumn: string,
) {
  let relations: RelationDescription[] = [];
  if (Reflect.hasMetadata(metadata.relations, target)) {
    relations = Reflect.getMetadata(metadata.relations, target);
  }

  relations.push({ propertyKey, type, getModel, targetColumn });

  Reflect.defineMetadata(metadata.relations, relations, target);
}
