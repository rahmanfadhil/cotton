import { BaseAdapter } from "./baseadapter.ts";
import { ObjectType } from "./types.ts";

interface ModelConfig {
  tableName: string;
  primaryKey: string;
}

export class Manager {
  constructor(private adapter: BaseAdapter) {}

  async find<T>(model: ObjectType<T>): Promise<T[]> {
    const { tableName } = this.getModelConfig(model);
    const result = await this.adapter.queryBuilder(tableName).execute();
    return this.createModels(model, result);
  }

  async findOne<T>(
    model: ObjectType<T>,
    condition: number | string | Partial<T>,
  ): Promise<T | null> {
    const { tableName } = this.getModelConfig(model);

    const query = this.adapter.queryBuilder(tableName).first();

    // TODO: use `where` to query table columns
    if (typeof condition === "number" || typeof condition === "string") {
      query.where("id", condition);
    }

    const result = await query.execute();

    if (result.length > 0) {
      return this.createModel(model, result[0]);
    } else {
      return null;
    }
  }

  /**
   * Retrieve database model informations
   * 
   * @param model The model to get the information
   */
  private getModelConfig(model: ObjectType<any>): ModelConfig {
    let tableName: string;
    let primaryKey: string;

    // Get model's table name
    if (typeof (model as any).tableName !== "string") {
      throw new Error(`Model '${model.name}' doesn't have a table name!`);
    } else {
      tableName = (model as any).tableName;
    }

    // Get model's table name
    if (typeof (model as any).primaryKey === "string") {
      primaryKey = (model as any).primaryKey;
    } else {
      throw new Error(`Model '${model.name}' has an invalid primary key!`);
    }

    return { tableName, primaryKey };
  }

  // --------------------------------------------------------------------------------
  // TRANSFORM OBJECT TO MODEL CLASS
  // --------------------------------------------------------------------------------

  /**
   * Transform single plain JavaScript object to Model class
   * 
   * @param model The database model
   * @param data List of plain JavaScript objects
   */
  private createModel<T>(
    model: ObjectType<T>,
    data: { [key: string]: any },
  ): T {
    return Object.assign(new model(), data);
  }

  /**
   * Transform multiple plain JavaScript objects to Model classes
   * 
   * @param model The database model
   * @param data List of plain JavaScript objects
   */
  private createModels<T>(
    model: ObjectType<T>,
    data: { [key: string]: any }[],
  ): T[] {
    return data.map((item) => {
      return Object.assign(new model(), item);
    });
  }
}
