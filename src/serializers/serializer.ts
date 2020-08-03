import { getProperties } from "../utils/serializers.ts";
import { SerializableDescription, JsonType } from "./decorators/serializer.ts";

/** An serialization error of a single class property. */
export interface ISerializationError {
  /** The property name where the error occurs. */
  target: string;

  /** The error message. */
  message: string;
}

/** A error which occurs when model serialization or deserialization failed. */
export class SerializationError extends Error {
  constructor(public errors: ISerializationError[], modelName: string) {
    super(`Failed to serialize '${modelName}' model!`);
  }
}

/** A tool for serializing and deserializing model instances. */
export class Serializer<T> {
  /** All serializable propertis of the model. */
  private properties: SerializableDescription[];

  /** Create a new serializer for a model. */
  constructor(private modelClass: { new (): T }) {
    this.properties = getProperties(modelClass);
  }

  /** Transform model instance to JSON compatible object. */
  public dump(model: T): { [key: string]: JsonType };

  /** Transform model instances to JSON compatible array. */
  public dump(model: T[]): { [key: string]: JsonType }[];

  /** Transform model instance to JSON compatible object. */
  public dump(
    model: T | T[],
  ): { [key: string]: JsonType } | { [key: string]: JsonType }[] {
    return Array.isArray(model)
      ? model.map((item) => this._toJSON(item))
      : this._toJSON(model);
  }

  /** Transform a plain object into a model instance. */
  public load(data: any): T {
    // Create the model instance.
    const model = Object.create(this.modelClass.prototype);

    // Serialization values and errors.
    const values: { [key: string]: any } = {};
    const errors: ISerializationError[] = [];

    // Loop through defined properties.
    for (const property of this.properties) {
      const value = data[property.name];

      if (property.isReadonly) {
        continue;
      }

      // If the value is `null` or `undefined`, check if the
      // property is nullable. If it doesn't, append error to the
      // error list. Otherwise, return set value to null.
      if (value === undefined || value === null) {
        if (property.isRequired) {
          errors.push({
            target: property.name,
            message: "value cannot be empty!",
          });
        } else {
          values[property.propertyKey] = null;
        }
      } else {
        let serialized = value;

        // If a serializer is defined, serialize the value.
        if (property.serialize) {
          try {
            serialized = property.serialize.up(serialized);
          } catch (err) {
            errors.push({
              target: property.name,
              message: err.message,
            });
          }
        }

        values[property.propertyKey] = serialized;
      }
    }

    // If there's an error, throw it.
    if (errors.length >= 1) {
      throw new SerializationError(errors, this.modelClass.name);
    }

    // Otherwise, populate the model with serialized values and return it.
    return Object.assign(model, values);
  }

  /** Transform an array of plain objects into a model instance. */
  public loadMany(data: Array<any>): T[] {
    return data.map((item) => this.load(item));
  }

  // --------------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------------

  private _toJSON(model: T): { [key: string]: JsonType } {
    const data: { [key: string]: JsonType } = {};
    const errors: ISerializationError[] = [];

    for (const property of this.properties) {
      if (!property.isHidden) {
        let value = (model as any)[property.propertyKey];

        if (value === null || typeof value === "undefined") {
          if (property.isRequired) {
            errors.push({
              target: property.propertyKey,
              message: "value cannot be empty!",
            });
          } else {
            data[property.name] = null;
          }
        } else {
          if (property.serialize) {
            try {
              value = property.serialize.down(value);
            } catch (err) {
              errors.push({
                target: property.propertyKey,
                message: err.message,
              });
            }
          }

          data[property.name] = value;
        }
      }
    }

    if (errors.length >= 1) {
      throw new SerializationError(errors, this.modelClass.name);
    }

    return data;
  }
}
