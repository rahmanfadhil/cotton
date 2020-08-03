import { Reflect } from "../../utils/reflect.ts";
import { metadata } from "../../constants.ts";
import { TypeSerializer } from "../serializers/typeserializer.ts";
import { getDataType } from "../../utils/models.ts";

/** Configure serializable property. */
export interface SerializableOptions {
  /** Override property name when serializing to JSON. */
  name: string;

  /** Prevent the property to be `null` or `undefined`. */
  isRequired: boolean;

  /** Hide property by default. */
  isHidden: boolean;

  /** Prevent property to be modified. */
  isReadonly: boolean;
}

/** Valid JSON types. */
export type JsonType =
  | string
  | number
  | boolean
  | null
  | Array<JsonType>
  | { [key: string]: JsonType };

/** Property serializer. */
export interface ISerialize {
  /** Transform value from plain JS object to model instance. */
  up(value: any): any;

  /** Transform value from model instance to JSON valid values. */
  down(value: any): JsonType;
}

/** All information on a serializable property. */
export interface SerializableDescription
  extends Omit<SerializableOptions, "serializers"> {
  /** The property name of the class. */
  propertyKey: string;

  /** All serializers for this property. */
  serialize?: ISerialize;
}

/**
 * Make class property serializable.
 * 
 * @param options configure how the property should be serialized.
 */
export function Serializable(
  options?: Partial<SerializableOptions>,
  serialize?: ISerialize,
) {
  return (target: Object, propertyKey: string) => {
    let serializables: SerializableDescription[] = [];
    if (Reflect.hasMetadata(metadata.serializables, target)) {
      serializables = Reflect.getMetadata(metadata.serializables, target);
    }

    const type = getDataType(
      Reflect.getMetadata("design:type", target, propertyKey),
    );

    serializables.push({
      name: propertyKey,
      propertyKey,
      isHidden: false,
      isReadonly: false,
      isRequired: false,
      serialize: serialize
        ? serialize
        : type !== null
        ? new TypeSerializer(type)
        : undefined,
      ...options,
    });

    Reflect.defineMetadata(metadata.serializables, serializables, target);
  };
}
