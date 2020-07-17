import { Reflect } from "./reflect.ts";
import {
  ColumnDescription,
  RelationDescription,
  FieldType,
  RelationType,
} from "../models/fields.ts";
import { Model } from "../models/model.ts";

/** All models' original values */
const originalValues = new WeakMap();

/** List of all saved models */
const savedModels = new WeakMap();

/**
 * Get all columns from a model
 */
export function getColumns(modelClass: any): ColumnDescription[] {
  if (!Reflect.hasMetadata("db:columns", modelClass.prototype)) {
    throw new Error("A model should have at least one column!");
  }

  return Reflect.getMetadata("db:columns", modelClass.prototype);
}

/**
 * Get all table relations from a model.
 * 
 * @param modelClass the database model class
 * @param includes include several relations and ignore the rest
 */
export function getRelations(
  modelClass: any,
  includes?: string[],
): RelationDescription[] {
  const relations: RelationDescription[] =
    Reflect.hasMetadata("db:relations", modelClass.prototype)
      ? Reflect.getMetadata("db:relations", modelClass.prototype)
      : [];
  return includes
    ? relations.filter((item) => includes.includes(item.propertyKey))
    : relations;
}

export function extractRelationalRecord(result: any, modelClass: typeof Model) {
  const values: { [key: string]: any } = {};
  const tableName = getTableName(modelClass);
  const columns = getColumns(modelClass);

  for (const column in result) {
    if (column.startsWith(tableName + "__")) {
      const columnName = column.slice(tableName.length + 2);
      const propertyKey = columns.find((item) => item.name === columnName)
        ?.propertyKey || columnName;
      values[propertyKey] = result[column];
    }
  }

  return values;
}

/**
 * Transform single plain JavaScript object to Model class.
 * 
 * @param modelClass The model class which all the data will be transformed into
 * @param data A plain JavaScript object that holds the model data
 * @param fromDatabase Check whether the data is saved to the database or not
 */
export function createModel<T>(
  modelClass: typeof Model,
  data: { [key: string]: any },
  fromDatabase: boolean = false,
): T {
  const relations = getRelations(modelClass);

  for (const relation of relations) {
    const relationModel = relation.getModel();
    const relationData = data[relation.propertyKey];

    if (relation.type === RelationType.BelongsTo) {
      if (typeof relationData === "object") {
        data[relation.propertyKey] = createModel(
          relationModel,
          relationData,
          fromDatabase,
        );
      } else {
        data[relation.propertyKey] = null;
      }
    } else if (relation.type === RelationType.HasMany) {
      if (
        Array.isArray(relationData) &&
        relationData.length > 0
      ) {
        data[relation.propertyKey] = createModels(
          relationModel,
          relationData,
          fromDatabase,
        );
      } else {
        data[relation.propertyKey] = [];
      }
    }
  }

  const model = Object.create(modelClass.prototype);
  const result = Object.assign(model, data);

  // Normalize input data
  normalizeModel(result);

  // Set the isSaved value
  setSaved(result, fromDatabase);

  return result;
}

/**
 * Transform an array of plain JavaScript objects to multiple Model classes.
 * 
 * @param modelClass The model class which all the data will be transformed into
 * @param data A plain JavaScript object that holds the model data
 * @param fromDatabase Check whether the data is saved to the database or not
 */
export function createModels<T>(
  modelClass: typeof Model,
  data: { [key: string]: any }[],
  fromDatabase: boolean = false,
): T[] {
  return data.map((item) => {
    return createModel(modelClass, item, fromDatabase);
  });
}

/**
 * Normalize model values from the database.
 * 
 * @param model the model you want to normalize
 */
export function normalizeModel<T extends Model>(model: T): T {
  const columns = getColumns(model.constructor);

  for (const column of columns) {
    let original = (model as any)[column.propertyKey];
    let value: any;

    if (typeof original === "undefined" || original === null) {
      value = null;
    } else if (column.type === FieldType.Date && !(original instanceof Date)) {
      value = new Date((model as any)[column.propertyKey]);
    } else if (
      column.type === FieldType.String && typeof original !== "string"
    ) {
      value = String((model as any)[column.propertyKey]);
    } else if (
      column.type === FieldType.Number && typeof original !== "number"
    ) {
      value = Number((model as any)[column.propertyKey]);
    } else if (
      column.type === FieldType.Boolean && typeof original !== "boolean"
    ) {
      value = Boolean((model as any)[column.propertyKey]);
    } else {
      value = (model as any)[column.propertyKey];
    }

    (model as any)[column.propertyKey] = value;
  }

  return model;
}

/**
 * Get the original value of a model.
 */
export function getOriginal<T extends Model>(model: T): {
  [key: string]: any;
} | undefined {
  return originalValues.get(model);
}

/**
 * Update the `isSaved` status of a model and save the original value.
 *
 * @param model the model you want to change the status
 * @param value the status of the model (saved or not saved)
 */
export function setSaved<T extends Model>(model: T, value: boolean): void {
  savedModels.set(model, value);

  if (value) {
    originalValues.set(model, getValues(model));
  } else {
    originalValues.delete(model);
  }
}

/**
 * Check wether this model is saved or not.
 *
 * @param model the model you want to check the status
 */
export function isSaved<T extends Model>(model: T): boolean {
  return savedModels.get(model) ? true : false;
}

/**
 * Map raw SQL JOIN result.
 *
 * @param modelClass the main model
 * @param includes which relations are included in this query
 * @param result the query result itself
 */
export function mapRelationalResult(
  modelClass: typeof Model,
  includes: string[],
  result: any[],
): any[] {
  const relations = getRelations(modelClass, includes);
  const primaryKey = getPrimaryKeyInfo(modelClass);

  return result.reduce((prev, next) => {
    if (
      prev.length !== 0 &&
      prev[prev.length - 1][primaryKey.propertyKey] ===
        next[getTableName(modelClass) + "__" + primaryKey.name]
    ) {
      for (const relation of relations) {
        if (relation.type === RelationType.HasMany) {
          const data = extractRelationalRecord(
            next,
            relation.getModel(),
          );
          prev[prev.length - 1][relation.propertyKey] =
            (prev[prev.length - 1][relation.propertyKey] || [])
              .concat(data);
        }
      }
    } else {
      const data = extractRelationalRecord(next, modelClass);

      for (const relation of relations) {
        const tableName = getTableName(relation.getModel());
        const relationPrimaryKey = getPrimaryKeyInfo(relation.getModel()).name;

        if (relation.type === RelationType.HasMany) {
          if (next[tableName + "__" + relationPrimaryKey] === null) {
            data[relation.propertyKey] = [];
          } else {
            data[relation.propertyKey] = [
              extractRelationalRecord(next, relation.getModel()),
            ];
          }
        } else if (relation.type === RelationType.BelongsTo) {
          if (next[tableName + "__" + relationPrimaryKey] === null) {
            data[relation.propertyKey] = null;
          } else {
            data[relation.propertyKey] = extractRelationalRecord(
              next,
              relation.getModel(),
            );
          }
        }
      }

      prev.push(data);
    }

    return prev;
  }, []);
}

/**
 * Get the default table name from a model class
 */
export function getTableName(modelClass: typeof Model): string {
  return modelClass.tableName
    ? modelClass.tableName
    : modelClass.name.toLowerCase() + "s";
}

/**
 * Compare the current values against the last saved data
 *
 * @param model the model you want to compare
 */
export function compareWithOriginal<T extends Model>(model: T): {
  isDirty: boolean;
  changedFields: string[];
} {
  const originalValue = getOriginal(model);

  // If there's is no original value, the object is not saved to the database yet
  // which means it's dirty.
  if (originalValue) {
    let isDirty = false;
    const changedFields: string[] = [];

    // Loop for the fields, if one of the fields doesn't match, the object is dirty
    for (const column of getColumns(model.constructor)) {
      const value = (model as any)[column.propertyKey];

      if (value !== originalValue[column.name]) {
        isDirty = true;
        changedFields.push(column.propertyKey);
      }
    }

    return { isDirty, changedFields };
  } else {
    return { isDirty: true, changedFields: [] };
  }
}

/**
 * Get model values as a plain JavaScript object
 * 
 * @param model the model you want to get the values from
 * @param columns the columns to be retrieved
 */
export function getValues<T extends Model>(model: T, columns?: string[]): {
  [key: string]: any;
} {
  // If the `columns` parameter is provided, return only the selected columns
  const selectedColumns = columns
    ? getColumns(model.constructor)
      .filter((item) => columns.includes(item.propertyKey))
    : getColumns(model.constructor);

  // Hold the data temporarily
  const data: { [key: string]: any } = {};

  // Loop through the selected columns
  for (const column of selectedColumns) {
    const value = (model as any)[column.propertyKey];

    // If one of the selected columns is the primary key, the record needs to be saved first.
    if (column.isPrimaryKey) {
      if (isSaved(model)) {
        data[column.name] = value;
      }
    } else {
      if (typeof value === "undefined") {
        // If the value is undefined, check the default value. Then, if the column
        // is nullable, set it to null. Otherwise, throw an error.
        if (typeof column.default !== "undefined") {
          // If the default value is a function, execute it and get the returned value
          data[column.name] = typeof column.default === "function"
            ? column.default()
            : column.default;
        } else if (column.isNullable === true) {
          data[column.name] = null;
        } else {
          throw new Error(
            `Field '${column.propertyKey}' cannot be empty!'`,
          );
        }
      } else {
        data[column.name] = (model as any)[column.propertyKey];
      }
    }
  }

  return data;
}

/**
 * Get the primary key value of a model.
 */
export function getPrimaryKey<T extends Model>(model: T): number {
  const primaryKey = getPrimaryKeyInfo(<typeof Model> model.constructor);
  return (model as any)[primaryKey.propertyKey];
}

/**
 * Set the primary key value of a model.
 */
export function setPrimaryKey<T extends Model>(
  model: T,
  value: number,
) {
  const primaryKey = getPrimaryKeyInfo(<typeof Model> model.constructor);
  (model as any)[primaryKey.propertyKey] = value;
}

/**
 * Get the primary field column description from a model class.
 */
export function getPrimaryKeyInfo(modelClass: typeof Model): ColumnDescription {
  const primaryKey = getColumns(modelClass)
    .find((item) => item.isPrimaryKey);

  if (!primaryKey) {
    throw new Error(`Model '${modelClass.name}' must have a primary key!`);
  }

  return primaryKey;
}
