import { getProperties } from "../utils/serializers.ts";
import { SerializableDescription } from "./decorators/serializer.ts";

export interface ISerializationError {
  target: string;
  message: string;
}

export class SerializationError extends Error {
  constructor(public errors: ISerializationError[]) {
    super();
  }
}

export class Serializer<T> {
  /** All serializable propertis of the model. */
  private properties: SerializableDescription[];

  constructor(private modelClass: { new (): T }) {
    this.properties = getProperties(modelClass);
  }

  /** Transform plain object into a model instance. */
  public load(data: any): T {
    // Create the model instance.
    const model = Object.create(this.modelClass.prototype);

    // Serialization values and errors.
    const values: { [key: string]: any } = {};
    const errors: ISerializationError[] = [];

    // Loop through defined properties.
    for (const property of this.properties) {
      const value = data[property.name];

      // If the value is `null` or `undefined`, check if the
      // property is nullable. If it doesn't, append error to the
      // error list. Otherwise, return set value to null.
      if (value === undefined || value === null) {
        if (property.isNullable) {
          values[property.propertyKey] = null;
        } else {
          errors.push({
            target: property.name,
            message: "value cannot be null!",
          });
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
      throw new SerializationError(errors);
    }

    // Otherwise, populate the model with serialized values and return it.
    return Object.assign(model, values);
  }
}
