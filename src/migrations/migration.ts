import { Schema } from "./schema.ts";

/** Migrate the database */
export abstract class Migration {
  public abstract up(schema: Schema): Promise<void>;
  public abstract down(schema: Schema): Promise<void>;
}
