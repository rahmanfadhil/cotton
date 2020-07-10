import { QueryBuilder } from "../querybuilder.ts";
import { Model } from "../models/model.ts";
import { DatabaseDialect } from "../connect.ts";

/**
 * Database connection options
 */
export interface ConnectionOptions {
  database?: string;
  username?: string;
  port?: number;
  hostname?: string;
  password?: string;
  applicationName?: string;
}

/**
 * The parent class for all database adapters
 */
export abstract class Adapter {
  private models: Array<typeof Model> = [];
  public abstract dialect: DatabaseDialect;

  public abstract lastInsertedId: number;

  /**
   * Run SQL query and get the result
   *
   * @param query SQL query to run (ex: "SELECT * FROM users;")
   * @param values provides values to query placeholders
   */
  public abstract query<T>(query: string, values?: any[]): Promise<T[]>;

  /**
   * Connect database
   */
  public abstract connect(): Promise<void>;

  /**
   * Disconnect database
   */
  public abstract disconnect(): Promise<void>;

  /**
   * Query builder
   *
   * @param tableName The table name which the query is targetting
   */
  public table(tableName: string): QueryBuilder {
    return new QueryBuilder(tableName, this);
  }

  /**
   * Register a model
   *
   * @param model The model to be registered
   */
  public addModel(model: typeof Model): void {
    model.adapter = this;
    this.models.push(model);
  }

  /**
   * Returns an array containing all classes of the Models registered with 'addModel'.
   */
  public getModels(): Array<typeof Model> {
    return this.models;
  }

  /**
   * Truncates all registered model tables with 'Model.truncate'.
   */
  public async truncateModels(): Promise<void> {
    for (const model of this.models) {
      await model.truncate();
    }
  }
}
