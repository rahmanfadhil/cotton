import {
  isSaved,
  compareWithOriginal,
  getTableName,
  getPrimaryKeyInfo,
  getValues,
  setSaved,
  getColumns,
  mapValueProperties,
} from "./utils/models.ts";
import { Adapter } from "./adapters/adapter.ts";

/**
 * Manager allows you to perform queries to your model.
 */
export class Manager {
  /**
   * Create a model manager.
   *
   * @param adapter the database adapter to perform queries
   */
  constructor(private adapter: Adapter) {}

  /**
   * Save model to the database.
   *
   * @param model the model you want to save
   */
  public async save<T extends Object>(model: T): Promise<T> {
    const tableName = getTableName(model.constructor);
    const primaryKeyInfo = getPrimaryKeyInfo(model.constructor);

    // If the record is saved, we assume that the user want to update the record.
    // Otherwise, create a new record to the database.
    if (isSaved(model)) {
      const { isDirty, diff } = compareWithOriginal(model);

      if (isDirty) {
        await this.adapter
          .table(tableName)
          .where(
            primaryKeyInfo.name,
            (model as any)[primaryKeyInfo.propertyKey],
          )
          .update(diff)
          .execute();
      }
    } else {
      const values = getValues(model);

      // Save record to the database
      const query = this.adapter
        .table(tableName)
        .insert(values);

      // The postgres adapter doesn't have `lastInsertedId`. So, we need to
      // manually return the primary key in order to set the model's primary key
      if (this.adapter.dialect === "postgres") {
        query.returning(primaryKeyInfo.name);
      }

      // Execute the query
      const result = await query.execute();

      // Get last inserted id
      const lastInsertedId: number = this.adapter.dialect === "postgres"
        ? result[result.length - 1][primaryKeyInfo.name] as number
        : this.adapter.lastInsertedId;

      // Set the primary key
      values[primaryKeyInfo.name] = lastInsertedId;

      // Populate empty properties with default value
      Object.assign(
        model,
        mapValueProperties(model.constructor, values),
      );
    }

    // Save the model's original values
    setSaved(model, true);

    return model;
  }
}
