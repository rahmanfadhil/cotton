import { SerializableDescription } from "../serializers/decorators/serializer.ts";
import { Reflect } from "./reflect.ts";
import { metadata } from "../constants.ts";

/**
 * Retrieve all serializable properties in a model class.
 * 
 * @param target the model class you want to retrieve the information from
 */
export function getProperties(target: Function): SerializableDescription[] {
  const properties = Reflect.getMetadata(
    metadata.serializables,
    target.prototype,
  );

  if (!Array.isArray(properties)) {
    throw new Error(
      `Class '${target.name}' must have at least one serializable property!`,
    );
  }

  return properties;
}
