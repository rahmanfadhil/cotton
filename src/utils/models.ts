import {
  ColumnDescription,
  RelationDescription,
  ColumnType,
  RelationType,
} from "../model.ts";
import { DatabaseResult, DatabaseValues } from "../adapters/adapter.ts";
import { Reflect } from "../utils/reflect.ts";
import { metadata } from "../constants.ts";

// --------------------------------------------------------------------------------
// INTERFACES
// --------------------------------------------------------------------------------

/** Model values from the query result */
interface ModelValues {
  [key: string]: DatabaseValues | ModelValues | ModelValues[];
}

/** Model values which can be sent to the database to insert or update */
interface ModelDatabaseValues {
  [key: string]: DatabaseValues;
}

/** The result of comparing the current model with its original value. */
interface ModelComparisonResult {
  isDirty: boolean;
  diff: ModelDatabaseValues;
}

interface ModelRelationComparisonResult {
  isDirty: boolean;
  diff: { type: RelationType; data: number | number[] }[];
}

// --------------------------------------------------------------------------------
// MODEL INFORMATION
// --------------------------------------------------------------------------------

/**
 * Get the table name from a model.
 *
 * @param modelClass the model class you want to get the information from.
 */
export function getTableName(modelClass: Function): string {
  const tableName = Reflect.getMetadata(metadata.tableName, modelClass);

  if (!tableName) {
    throw new Error(
      `Class '${modelClass.name}' must be wrapped with @Model decorator!`,
    );
  }

  return tableName;
}

/**
 * Get all column definitions from a model.
 *
 * @param modelClass the model class you want to get the information from.
 */
export function getColumns(modelClass: Function): ColumnDescription[] {
  const columns: ColumnDescription[] = Reflect.getMetadata(
    metadata.columns,
    modelClass.prototype,
  );

  if (!columns) {
    throw new Error(
      `Model '${modelClass.name}' must have at least one column!`,
    );
  }

  return columns;
}

/**
 * Find a single column information from a model. This can be used to
 * get `select: false` column which you cannot get from `getColumns`
 * by default.
 *
 * @param modelClass the model class you want to get the information from.
 * @param propertyName the column property key
 */
export function findColumn(
  modelClass: Function,
  propertyName: string,
): ColumnDescription | undefined {
  return getColumns(modelClass)
    .find((item) => item.propertyKey === propertyName);
}

/**
 * Get all relationship definitions from a model.
 *
 * @param modelClass the model class you want to get the information from.
 * @param includes include several relations and ignore the rest.
 */
export function getRelations(
  modelClass: Function,
  includes?: string[],
): RelationDescription[] {
  const relations: RelationDescription[] =
    Reflect.hasMetadata(metadata.relations, modelClass.prototype)
      ? Reflect.getMetadata(metadata.relations, modelClass.prototype)
      : [];
  return includes
    ? relations.filter((item) => includes.includes(item.propertyKey))
    : relations;
}

/**
 * Get the primary key column information from a model.
 *
 * @param modelClass the model class you want to get the information from.
 */
export function getPrimaryKeyInfo(modelClass: Function): ColumnDescription {
  const primaryKey = getColumns(modelClass)
    .find((item) => item.isPrimaryKey);

  if (!primaryKey) {
    throw new Error(`Model '${modelClass.name}' must have a primary key!`);
  }

  return primaryKey;
}

// --------------------------------------------------------------------------------
// MODEL STATE
// --------------------------------------------------------------------------------

/** Map of models' original values */
const originalValues = new WeakMap<Object, ModelValues>();

/** Map of models' `isSaved` status */
const isSavedValues = new WeakMap<Object, boolean>();

/**
 * Check wether this model is saved to the database.
 *
 * @param model the model you want to check the status of
 */
export function isSaved(model: Object): boolean {
  return isSavedValues.get(model) ? true : false;
}

/**
 * Update the `isSaved` status of a model, save the original value,
 * and populate model with default values.
 *
 * @param model the model you want to change the status of
 * @param value the status of the model (saved or not saved)
 */
export function setSaved(model: Object, value: boolean) {
  isSavedValues.set(model, value);

  if (value) {
    const values = getValues(model);
    originalValues.set(model, values);
    Object.assign(
      model,
      mapValueProperties(model.constructor, values, "propertyKey"),
    );
  } else {
    originalValues.delete(model);
  }
}

/**
 * Update the `isSaved` status of a model and save the original value.
 *
 * @param model the model you want to change the status of
 * @param value the status of the model (saved or not saved)
 */
export function getOriginal(model: Object): ModelValues | undefined {
  return originalValues.get(model);
}

/**
 * Compare the current values against the last saved data
 * 
 * @param model the model you want to compare
 */
export function compareWithOriginal(model: Object): ModelComparisonResult {
  const originalValue = getOriginal(model);

  // If there's is no original value, the object is not saved to the database yet
  // which means it's dirty.
  if (!originalValue) {
    return { isDirty: true, diff: {} };
  }

  let isDirty = false;
  const diff: ModelDatabaseValues = {};

  // Loop for the fields, if one of the fields doesn't match, the object is dirty
  for (const column of getColumns(model.constructor)) {
    const value = (model as any)[column.propertyKey];

    if (value !== originalValue[column.name]) {
      isDirty = true;
      diff[column.name] = getNormalizedValue(column, value);
    }
  }

  return { isDirty, diff };
}

/**
 * Get model values as a plain JavaScript object
 * 
 * @param model the model you want to get the values from
 */
export function getValues(model: Object): ModelDatabaseValues {
  // If the `columns` parameter is provided, return only the selected columns
  const columns = getColumns(model.constructor)
    .filter((item) => item.isPrimaryKey && !isSaved(model) ? false : true);

  // Hold the data temporarily
  const data: { [key: string]: DatabaseValues } = {};

  // Loop through the columns
  for (const column of columns) {
    const value = (model as any)[column.propertyKey];

    // If one of the selected columns is the primary key, the record needs to be saved first.
    if (column.isPrimaryKey) {
      if (isSaved(model)) {
        data[column.name] = value as number;
      }
    } else {
      if (typeof value === "undefined") {
        // If the value is undefined, check the default value. Otherwise, set it to null.
        if (typeof column.default !== "undefined") {
          // If the default value is a function, execute it and get the returned value
          const defaultValue = typeof column.default === "function"
            ? column.default()
            : column.default;
          data[column.name] = getNormalizedValue(column, defaultValue);
        } else {
          data[column.name] = null;
        }
      } else {
        data[column.name] = getNormalizedValue(
          column,
          (model as any)[column.propertyKey],
        );
      }
    }
  }

  return data;
}

/**
 * Get relational values in a model.
 * 
 * @param model the model object you want to check the relations
 * @param relations include specific relation names and ignore the rest
 */
export function getRelationValues(model: Object, relations?: string[]) {
  const data: {
    description: RelationDescription;
    value: number | number[];
  }[] = [];

  for (const relation of getRelations(model.constructor, relations)) {
    const relationData = (model as any)[relation.propertyKey];

    // Add belongs to relationships to `data`
    if (
      relation.type === RelationType.BelongsTo &&
      relationData &&
      relationData instanceof relation.getModel()
    ) {
      // If the target record is not saved yet, throw an error.
      if (!isSaved(relationData)) {
        throw new Error(
          `Unsaved relationships found when trying to insert '${model.constructor.name}' model!`,
        );
      }

      // Get the primary key propertyKey of the related model
      const relationIdProperty =
        getPrimaryKeyInfo(relation.getModel()).propertyKey;

      data.push({
        description: relation,
        value: relationData[relationIdProperty],
      });
    }

    // Add has many relationships to `data`
    if (
      relation.type === RelationType.HasMany &&
      Array.isArray(relationData) &&
      relationData.length >= 1
    ) {
      // Get the primary key propertyKey of the related model
      const relationIdProperty =
        getPrimaryKeyInfo(relation.getModel()).propertyKey;

      // Get all relationships primary key, if one of those isn't saved yet, throw an error.
      const value = relationData.map((item) => {
        if (!isSaved(item)) {
          throw new Error(
            `Unsaved relationships found when trying to insert '${model.constructor.name}' model!`,
          );
        }

        return item[relationIdProperty];
      });

      data.push({ description: relation, value });
    }
  }

  return data;
}

/**
 * Map values from `getValues` to be compatible with model properties vice versa.
 * 
 * @param modelClass the model class of those values.
 * @param values the model values.
 * @param to the property naming convention you want to convert.
 */
export function mapValueProperties(
  modelClass: Function,
  values: ModelDatabaseValues,
  to: "propertyKey" | "name",
): ModelDatabaseValues {
  const data: ModelDatabaseValues = {};
  const columns = getColumns(modelClass);

  for (const key in values) {
    const column = columns
      .find((item) => item[to === "name" ? "propertyKey" : "name"] === key);

    if (column) {
      data[column[to]] = values[key];
    }
  }

  return data;
}

// --------------------------------------------------------------------------------
// PRIVATE HELPERS
// --------------------------------------------------------------------------------

/**
 * Normalize value to a database compatible values.
 * 
 * @param columns the column definitions you want to include
 * @param original the original data
 */
function getNormalizedValue(
  column: ColumnDescription,
  original: DatabaseValues,
): DatabaseValues {
  let value: any;

  if (typeof original === "undefined" || original === null) {
    value = null;
  } else if (
    column.type === ColumnType.Date &&
    (typeof original === "string" || typeof original === "number")
  ) {
    value = new Date(original);
  } else if (
    column.type === ColumnType.String && typeof original !== "string"
  ) {
    value = String(original);
  } else if (
    column.type === ColumnType.Number && typeof original !== "number"
  ) {
    value = Number(original);
  } else if (
    column.type === ColumnType.Boolean && typeof original !== "boolean"
  ) {
    value = Boolean(original);
  } else {
    value = original;
  }

  return value;
}

// --------------------------------------------------------------------------------
// EXTRACT DATA FROM QUERY RESUT
// --------------------------------------------------------------------------------

/**
 * Map the query builder result for creating a model.
 */
export function mapQueryResult(
  modelClass: Function,
  result: DatabaseResult[],
  includes?: string[],
): ModelValues[] {
  const relations = includes ? getRelations(modelClass, includes) : [];
  const primaryKey = getPrimaryKeyInfo(modelClass);

  return result.reduce<ModelValues[]>((prev, next) => {
    if (
      prev.length !== 0 &&
      prev[prev.length - 1][primaryKey.propertyKey] ===
        next[getTableName(modelClass) + "__" + primaryKey.name]
    ) {
      for (const relation of relations) {
        if (relation.type === RelationType.HasMany) {
          const data = mapSingleQueryResult(
            relation.getModel(),
            next,
          );
          const previousData: ModelValues[] =
            prev[prev.length - 1][relation.propertyKey] as ModelValues[];

          if (Array.isArray(previousData)) {
            prev[prev.length - 1][relation.propertyKey] = previousData
              .concat([data]);
          } else {
            prev[prev.length - 1][relation.propertyKey] = [data];
          }
        }
      }
    } else {
      const data = mapSingleQueryResult(modelClass, next);

      for (const relation of relations) {
        const tableName = getTableName(relation.getModel());
        const relationPrimaryKey = getPrimaryKeyInfo(relation.getModel()).name;

        if (relation.type === RelationType.HasMany) {
          if (next[tableName + "__" + relationPrimaryKey] === null) {
            data[relation.propertyKey] = [];
          } else {
            data[relation.propertyKey] = [
              mapSingleQueryResult(relation.getModel(), next),
            ];
          }
        } else if (relation.type === RelationType.BelongsTo) {
          if (next[tableName + "__" + relationPrimaryKey] === null) {
            data[relation.propertyKey] = null;
          } else {
            data[relation.propertyKey] = mapSingleQueryResult(
              relation.getModel(),
              next,
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
 * Map a single record from the query builder result for creating a model.
 */
export function mapSingleQueryResult(
  modelClass: Function,
  result: DatabaseResult,
): ModelValues {
  const values: ModelValues = {};
  const tableName = getTableName(modelClass);
  const columns = getColumns(modelClass);

  for (const column in result) {
    if (column.startsWith(tableName + "__")) {
      const columnName = column.slice(tableName.length + 2);
      const propertyKey = columns.find((item) => item.name === columnName)
        ?.propertyKey;

      if (propertyKey) {
        values[propertyKey] = result[column];
      }
    }
  }

  return values;
}

// --------------------------------------------------------------------------------
// CREATE MODEL
// --------------------------------------------------------------------------------

/**
 * Transform single plain JavaScript object to Model class.
 * 
 * @param modelClass The model class which all the data will be transformed into
 * @param data A plain JavaScript object that holds the model data
 * @param fromDatabase Check whether the data is saved to the database or not
 */
export function createModel<T>(
  modelClass: { new (): T },
  data: ModelValues,
  fromDatabase: boolean = false,
): T {
  const values: { [key: string]: DatabaseValues | Object | Object[] } = {};

  for (const column of getColumns(modelClass)) {
    const value = data[column.propertyKey];

    // If one of the selected columns is the primary key, the record needs to be saved first.
    if (column.isPrimaryKey) {
      if (fromDatabase) {
        values[column.propertyKey] = value as number;
      }
    } else {
      if (value === undefined) {
        // If the value is undefined, check the default value.
        if (typeof column.default !== "undefined") {
          // If the default value is a function, execute it and get the returned value
          const defaultValue = typeof column.default === "function"
            ? column.default()
            : column.default;
          values[column.propertyKey] = getNormalizedValue(column, defaultValue);
        }
      } else {
        values[column.propertyKey] = getNormalizedValue(
          column,
          value as DatabaseValues,
        );
      }
    }
  }

  for (const relation of getRelations(modelClass)) {
    const relationModel = relation.getModel();
    const relationData = data[relation.propertyKey] as ModelValues;

    if (relation.type === RelationType.BelongsTo) {
      if (relationData) {
        values[relation.propertyKey] = createModel(
          relationModel,
          relationData,
          fromDatabase,
        );
      }
    } else if (relation.type === RelationType.HasMany) {
      if (Array.isArray(relationData)) {
        if (relationData.length >= 1) {
          values[relation.propertyKey] = createModels(
            relationModel,
            relationData,
            fromDatabase,
          );
        } else {
          values[relation.propertyKey] = [];
        }
      }
    }
  }

  // Create the model object
  const model = Object.assign(Object.create(modelClass.prototype), values);

  // Set the isSaved value
  if (fromDatabase) {
    setSaved(model, true);
  }

  return model;
}

/**
 * Transform an array of plain JavaScript objects to multiple Model classes.
 * 
 * @param modelClass The model class which all the data will be transformed into
 * @param data A plain JavaScript object that holds the model data
 */
export function createModels<T>(
  modelClass: { new (): T },
  data: ModelValues[],
  fromDatabase: boolean = false,
): T[] {
  return data.map((item) => createModel(modelClass, item, fromDatabase));
}
