import { Reflect } from "./utils/reflect.ts";
import { metadata } from "./constants.ts";

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

  /** Automatically select this column when fetching*/
  select: boolean;

  /** Is this column allowed to be empty? */
  isNullable: boolean;
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

    const description: ColumnDescription = Object.assign(
      {},
      {
        propertyKey: propertyKey,
        select: true,
        name: propertyKey,
        type: columnType,
        isPrimaryKey: false,
        isNullable: true,
      },
      options,
    );

    columns.push(description);

    Reflect.defineMetadata(metadata.columns, columns, target);
  };
}

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
 * Define a relation field
 * 
 * @param type the type of this relation (belongs to, has many, etc.)
 * @param getModel a callback function that returns the model associated with this relation.
 * @param column the column name that being targetted in this relation.
 */
export function Relation(
  type: RelationType,
  getModel: () => { new (): any },
  column: string,
) {
  return (target: Object, propertyKey: string) => {
    let relations: RelationDescription[] = [];
    if (Reflect.hasMetadata(metadata.relations, target)) {
      relations = Reflect.getMetadata(metadata.relations, target);
    }

    relations.push({
      propertyKey: propertyKey,
      type: type,
      getModel,
      targetColumn: column,
    });

    Reflect.defineMetadata(metadata.relations, relations, target);
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
      select: true,
      name: options?.name || "id",
      type: ColumnType.Number,
      isPrimaryKey: true,
      isNullable: false,
    });

    Reflect.defineMetadata(metadata.columns, columns, target);
  };
}
