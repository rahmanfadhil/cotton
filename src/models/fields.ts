import { Reflect } from "../utils/reflect.ts";

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
  type: FieldType;
  name: string;
  default?: any;
  select: boolean;
  nullable: boolean;
}

export type ColumnDescription = ColumnOptions & { propertyKey: string };

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
 * @param type the JavaScript type which will be transformed
 */
export function Field(options?: Partial<ColumnOptions>) {
  return (target: Object, propertyKey: string) => {
    let columns: ColumnDescription[] = [];
    if (Reflect.hasMetadata("db:columns", target)) {
      columns = Reflect.getMetadata("db:columns", target);
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
        nullable: false,
      },
      options,
    );

    columns.push(description);

    Reflect.defineMetadata("db:columns", columns, target);
  };
}
