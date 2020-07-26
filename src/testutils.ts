import { Adapter, ConnectionOptions } from "./adapters/adapter.ts";
import { connect } from "./connect.ts";
import { QueryBuilder, QueryDescription, QueryType } from "./querybuilder.ts";
import { assertEquals } from "../testdeps.ts";
import { QueryCompiler } from "./querycompiler.ts";
import { Model, Primary, Column, BelongsTo, HasMany } from "./model.ts";
import { JsonProperty } from "./serializer.ts";

/**
 * Postgres connection options
 */
export const postgresOptions: ConnectionOptions = {
  database: Deno.env.get("POSTGRES_DATABASE"),
  hostname: Deno.env.get("POSTGRES_HOSTNAME"),
  username: Deno.env.get("POSTGRES_USERNAME"),
  password: Deno.env.get("POSTGRES_PASSWORD"),
  port: Number(Deno.env.get("POSTGRES_PORT")) || 5432,
};

/**
 * MySQL connection options
 */
export const mysqlOptions: ConnectionOptions = {
  database: Deno.env.get("MYSQL_DATABASE"),
  hostname: Deno.env.get("MYSQL_HOSTNAME"),
  username: Deno.env.get("MYSQL_USERNAME"),
  password: Deno.env.get("MYSQL_PASSWORD"),
  port: Number(Deno.env.get("MYSQL_PORT")) || 3306,
};

/**
 * SQLite connection options
 */
export const sqliteOptions: ConnectionOptions = {
  database: ":memory:",
};

/**
 * Create test with database client
 * 
 * @param name Test name
 * @param fn Test function
 */
export async function testDB(
  name: string,
  fn: (client: Adapter) => void | Promise<void>,
) {
  Deno.test({
    name: `[sqlite]   ${name}`,
    fn: async () => {
      // Connect to database
      const db = await connect({
        type: "sqlite",
        ...sqliteOptions,
      });

      // Create dummy table `users`
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255),
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          age INTEGER,
          created_at DATETIME,
          is_active BOOLEAN,
          password VARCHAR(255)
        );
      `);

      // Create dummy table `product`
      await db.query(`
        CREATE TABLE IF NOT EXISTS product (
          product_id INTEGER PRIMARY KEY AUTOINCREMENT,
          title VARCHAR(255),
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      // Run the actual test
      await fn(db);

      // Drop dummy table `product`
      await db.query("DROP TABLE product;");

      // Drop dummy table `users`
      await db.query("DROP TABLE users;");

      // Disconnect to database
      await db.disconnect();
    },
  });

  Deno.test({
    name: `[postgres] ${name}`,
    fn: async () => {
      // Connect to database
      const db = await connect({
        type: "postgres",
        ...postgresOptions,
      });

      // Create dummy table `users`
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255),
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          age INTEGER,
          created_at TIMESTAMP,
          is_active BOOLEAN,
          password VARCHAR(255)
        );
      `);

      // Create dummy table `product`
      await db.query(`
        CREATE TABLE IF NOT EXISTS product (
          product_id SERIAL PRIMARY KEY,
          title VARCHAR(255),
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      // Run the actual test
      try {
        await fn(db);
      } catch (err) {
        // Drop dummy table `product`
        await db.query("DROP TABLE product;");

        // Drop dummy table `users`
        await db.query("DROP TABLE users;");

        // Disconnect to database
        await db.disconnect();

        throw err;
      }

      // Drop dummy table `product`
      await db.query("DROP TABLE product;");

      // Drop dummy table `users`
      await db.query("DROP TABLE users;");

      // Disconnect to database
      await db.disconnect();
    },
  });

  Deno.test({
    name: `[mysql]    ${name}`,
    fn: async () => {
      // Connect to database
      const db = await connect({
        type: "mysql",
        ...mysqlOptions,
      });

      // Create dummy table `users`
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          email VARCHAR(255),
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          age INTEGER,
          created_at DATETIME,
          is_active TINYINT,
          password VARCHAR(255)
        );
      `);

      // Create dummy table `product`
      await db.query(`
        CREATE TABLE IF NOT EXISTS product (
          product_id INTEGER PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255),
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      // Run the actual test
      try {
        await fn(db);
      } catch (err) {
        // Drop dummy table `product`
        await db.query("DROP TABLE product;");

        // Drop dummy table `users`
        await db.query("DROP TABLE users;");

        // Disconnect to database
        await db.disconnect();

        throw err;
      }

      // Drop dummy table `products`
      await db.query("DROP TABLE product;");

      // Drop dummy table `users`
      await db.query("DROP TABLE users;");

      // Disconnect to database
      await db.disconnect();
    },
  });
}

/**
 * Generate a test case for testing the QueryBuilder.
 * This will assert the query description of the builder
 * which will be passed to the QueryCompiler.
 * 
 * @param title the title of the test
 * @param fn callback function to build the query
 * @param description the expected description
 */
export function testQueryBuilder(
  title: string,
  fn: (query: QueryBuilder) => void,
  description: Partial<QueryDescription>,
) {
  Deno.test(`QueryBuilder: ${title}`, () => {
    const query = new QueryBuilder("users", {} as any);
    fn(query);
    const expected = Object.assign({}, {
      tableName: "users",
      type: QueryType.Select,
      columns: [],
      wheres: [],
      orders: [],
      returning: [],
      joins: [],
    }, description);
    const actual = (query as any).description;
    assertEquals(actual, expected);
  });
}

/**
 * Generate a test case for testing QueryCompiler. This will
 * create a new QueryCompiler and test it agaist the expected
 * query string and values.
 * 
 * @param title the title of the test
 * @param description the query description (comes from the QueryBuilder)
 * @param result the expected query string and values for multiple database dialects
 */
export function testQueryCompiler(
  title: string,
  description: Partial<QueryDescription>,
  result: {
    mysql: { text: string; values: any[] };
    postgres: { text: string; values: any[] };
    sqlite: { text: string; values: any[] };
  },
) {
  for (const dialect in result) {
    const spaces = dialect === "postgres"
      ? " "
      : dialect === "mysql"
      ? "    "
      : "   ";

    Deno.test(`[${dialect}]${spaces}QueryCompiler: ${title}`, () => {
      const compiler = new QueryCompiler(
        Object.assign({}, {
          tableName: "users",
          type: QueryType.Select,
          columns: [],
          wheres: [],
          orders: [],
          returning: [],
          joins: [],
        }, description),
        dialect as any,
      );
      const { text, values } = compiler.compile();
      assertEquals(text, (result as any)[dialect].text);
      assertEquals(values, (result as any)[dialect].values);
    });
  }
}

// Here is the model definitions for testing purposes, each
// items must represent something to test.

export const toUser = () => User;
export const toProduct = () => Product;
export const getCreationDate = () => new Date();

@Model("users")
export class User {
  /**
   * Represents a primary key column
   */
  @Primary()
  @JsonProperty({ isReadonly: true })
  id!: number;

  /**
   * Represents column with validation
   */
  @Column()
  @JsonProperty({ isRequired: true })
  email!: string;

  /**
   * Represents a string column with custom table column name
   */
  @Column({ name: "first_name" })
  @JsonProperty({ name: "first_name" })
  firstName!: string;

  /**
   * Represents a string column with custom table column name
   */
  @Column({ name: "last_name" })
  @JsonProperty({ name: "last_name" })
  lastName!: string;

  /**
   * Represents a number column
   */
  @Column()
  @JsonProperty()
  age!: number;

  /**
   * Represents a hidden column
   */
  @Column()
  @JsonProperty({ isHidden: true, isReadonly: true })
  password!: string;

  /**
   * Represents a date column with lazy default value
   */
  @Column({ name: "created_at", default: getCreationDate })
  @JsonProperty({ name: "created_at", isReadonly: true })
  createdAt!: Date;

  /**
   * Represents a boolean column with standard default value
   */
  @Column({ name: "is_active", default: false })
  @JsonProperty({ name: "is_active", isReadonly: true })
  isActive!: boolean;

  /**
   * Represents a has many relationship
   */
  @HasMany(toProduct, "user_id")
  products!: Product[];
}

/**
 * Represents a model with default table name and a custom id
 */
@Model()
export class Product {
  @Primary({ name: "product_id" })
  productId!: number;

  @Column()
  title!: string;

  @BelongsTo(toUser, "user_id")
  user!: User;
}
