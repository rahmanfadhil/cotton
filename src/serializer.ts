import { Reflect } from "./utils/reflect.ts";
import { metadata } from "./constants.ts";
import { getDataType, getNormalizedValue } from "./utils/models.ts";
import { DataType } from "./model.ts";

/**
 * Information of a serializable property.
 */
interface JsonPropertyOptions {
  /**
   * The exposed name for this property when being serialized to JSON.
   * By default, it will use the property key name.
   */
  name: string;

  /**
   * The property is hidden by default. It will hide this property when
   * serialized to JSON. False by default.
   */
  isHidden: boolean;

  /**
   * The property is required. If set to `true`, it will throw an error
   * if this property is null or undefined when deserializing. False
   * by default.
   */
  isRequired: boolean;

  /**
   * This property doesn't allowed to be changed, `false` by default.
   */
  isReadonly: boolean;

  /**
   * The expected type of the value.
   */
  type: DataType;
}

type JsonPropertyDescription = JsonPropertyOptions & {
  /**
   * The property key to serialize.
   */
  propertyKey: string;
};

/**
 * Enable JSON serialization and validation for this property using Serializer.
 * 
 * @param options customize json property
 */
export function JsonProperty(options?: Partial<JsonPropertyOptions>) {
  return (target: Object, propertyKey: string) => {
    let jsonProperties: JsonPropertyDescription[] = [];
    if (Reflect.hasMetadata(metadata.jsonProperties, target)) {
      jsonProperties = Reflect.getMetadata(
        metadata.jsonProperties,
        target,
      );
    }

    const typeMetadata = Reflect.getMetadata(
      "design:type",
      target,
      propertyKey,
    );
    const type = getDataType(typeMetadata);
    if (!type && !options?.type) {
      throw new Error(`Column '${propertyKey}' must have a type!`);
    }

    jsonProperties.push(Object.assign({}, {
      propertyKey,
      name: propertyKey,
      type,
      isHidden: false,
      isRequired: false,
      isReadonly: false,
    }, options));

    Reflect.defineMetadata(
      metadata.jsonProperties,
      jsonProperties,
      target,
    );
  };
}

/**
 * Get all json property informations from a model class.
 * 
 * @param modelClass the model class you want to retrieve the information
 */
export function getProperties(modelClass: Function): JsonPropertyDescription[] {
  const jsonProperties: JsonPropertyDescription[] = Reflect.getMetadata(
    metadata.jsonProperties,
    modelClass.prototype,
  );

  if (!jsonProperties) {
    throw new Error(
      `Class '${modelClass.name}' must have at least one json property using @JsonProperty!`,
    );
  }

  return jsonProperties;
}

/**
 * Serializer allows you to validate property values, serialize model
 * objects to JSON back and forth.
 */
export class Serializer<T> {
  /**
   * Initialize a serializer for a model.
   * 
   * @param modelClass the model class you want to serialize.
   */
  constructor(private modelClass: { new (): T }) {}

  /**
   * Transform model object to JSON.
   */
  public values(model: T): any {
    const properties = getProperties(this.modelClass);
    const data: any = {};

    for (const property of properties) {
      const value = (model as any)[property.propertyKey];

      if (!property.isHidden) {
        data[property.name] = value;
      }
    }

    return data;
  }

  /**
   * Populate model columns with JSON input.
   */
  public from(data: any): T {
    // Data should be an object with key-value pairs.
    if (typeof data !== "object") {
      throw new Error(
        `Expected data to be an object, but got '${typeof data}'!`,
      );
    }

    // Initialize model instance.
    const model: any = Object.create(this.modelClass.prototype);

    // Get all serializable json properties
    const properties = getProperties(this.modelClass);

    // Loop through all available properties and set the value.
    for (const property of properties) {
      const value = (data as any)[property.name];

      // If the property is readonly, the value should be null.
      if (property.isReadonly) {
        model[property.propertyKey] = null;
        continue;
      }

      // If the value is undefined or null, but the property is required,
      // throw an error. Otherwise, just set it to null.
      if (value === undefined || value === null) {
        if (property.isRequired) {
          throw new Error(
            `Property '${property.name}' cannot be empty!`,
          );
        } else {
          model[property.propertyKey] = null;
        }

        continue;
      }

      try {
        model[property.propertyKey] = getNormalizedValue(
          property.type,
          value,
          true,
        );
      } catch (err) {
        throw new Error(
          `Property '${property.name}' should be of type '${property.type}', but got '${err}'`,
        );
      }
    }

    return model;
  }
}

// /**
//  * A serializer class.
//  */
// export interface ISerializer {
//   serialize(data: any): any;
// }

// /**
//  * A deserializer class.
//  */
// export interface IDeserializer {
//   deserialize(data: any): any;
// }

// /**
//  * A validator class.
//  */
// export interface IValidator {
//   validate(data: any): void | Promise<void>;
// }
