import { DataType } from "../../model.ts";
import { formatDate, isValidDate } from "../../utils/date.ts";
import { ISerialize, JsonType } from "../decorators/serializer.ts";

export class TypeSerializer implements ISerialize {
  constructor(private type: DataType) {}

  up(value: any): any {
    if (this.type === DataType.Date && !(value instanceof Date)) {
      if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value);

        if (isValidDate(date)) {
          throw new Error("invalid date!");
        }

        return date;
      } else {
        throw new Error("value must be either string or number!");
      }
    } else if (this.type === DataType.String && typeof value !== "string") {
      return String(value);
    } else if (this.type === DataType.Number && typeof value !== "number") {
      const num = Number(value);

      if (isNaN(num)) {
        throw new Error("invalid number!");
      }

      return num;
    } else if (this.type === DataType.Boolean && typeof value !== "boolean") {
      return Boolean(value);
    }

    return value;
  }

  down(value: any): JsonType {
    if (this.type === DataType.Date) {
      if (!(value instanceof Date)) {
        throw new Error("value must be a date!");
      }

      if (!isValidDate(value)) {
        throw new Error("invalid date!");
      }

      return formatDate(value);
    } else if (this.type === DataType.String && typeof value !== "string") {
      return String(value);
    } else if (this.type === DataType.Number && typeof value !== "number") {
      const num = Number(value);

      if (isNaN(num)) {
        throw new Error("invalid number!");
      }

      return num;
    } else if (this.type === DataType.Boolean && typeof value !== "boolean") {
      return Boolean(value);
    }

    return value;
  }
}
