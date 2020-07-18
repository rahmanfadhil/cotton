import { Reflect } from "../utils/reflect.ts";
import { metadata } from "../constants.ts";

/**
 * Define a class as a database model.
 * 
 * @param tableName a custom table name for this model
 */
export function Entity(tableName?: string) {
  return (target: Function) => {
    Reflect.defineMetadata(
      metadata.tableName,
      tableName || target.name.toLowerCase() + "s",
      target,
    );
  };
}

/**
 * Transform database value to JavaScript types
 */
export enum FieldType {
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
  type: FieldType;

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

function getFieldType(type: any): FieldType | null {
  if (type === String) {
    return FieldType.String;
  } else if (type === Number) {
    return FieldType.Number;
  } else if (type === Date) {
    return FieldType.Date;
  } else if (type === Boolean) {
    return FieldType.Boolean;
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

    const fieldTypeMetadata = Reflect.getMetadata(
      "design:type",
      target,
      propertyKey,
    );
    const fieldType = getFieldType(fieldTypeMetadata);
    if (!fieldType) {
      throw new Error(
        `Cannot assign column '${propertyKey}' without a type!`,
      );
    }

    const description: ColumnDescription = Object.assign(
      {},
      {
        propertyKey: propertyKey,
        select: true,
        name: propertyKey,
        type: fieldType,
        isPrimaryKey: false,
        isNullable: false,
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
export function PrimaryField(options?: PrimaryFieldOptions) {
  return (target: Object, propertyKey: string) => {
    let columns: ColumnDescription[] = [];
    if (Reflect.hasMetadata(metadata.columns, target)) {
      columns = Reflect.getMetadata(metadata.columns, target);
    }

    columns.push({
      propertyKey,
      select: true,
      name: options?.name || "id",
      type: FieldType.Number,
      isPrimaryKey: true,
      isNullable: false,
    });

    Reflect.defineMetadata(metadata.columns, columns, target);
  };
}
