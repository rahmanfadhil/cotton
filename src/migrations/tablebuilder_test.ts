import { TableBuilder } from "./tablebuilder.ts";
import { assertEquals } from "../../testdeps.ts";
import { SupportedDatabaseType } from "../connect.ts";

function isTableQueryValid(
  builder: TableBuilder,
  dialect: SupportedDatabaseType,
  query: string,
) {
  (builder as any).adapter.type = dialect;
  assertEquals(builder.toSQL(), query);
}

Deno.test("TableBuilder: create basic table", () => {
  const builder = new TableBuilder("posts", {} as any);

  builder.id();
  builder.string("title", 100);
  builder.string("description");
  builder.text("content");
  builder.integer("likes");
  builder.bigInteger("price");
  builder.boolean("is_published");
  builder.datetime("published_at");
  builder.timestamps();

  isTableQueryValid(
    builder,
    "mysql",
    `create table posts (id integer primary key auto_increment, title varchar(100), description varchar(255), content longtext, likes integer, price bigint, is_published tinyint, published_at datetime, created_at datetime, updated_at datetime);`,
  );

  isTableQueryValid(
    builder,
    "sqlite",
    `create table posts (id integer primary key autoincrement, title varchar(100), description varchar(255), content text, likes integer, price bigint, is_published boolean, published_at datetime, created_at datetime, updated_at datetime);`,
  );

  isTableQueryValid(
    builder,
    "postgres",
    `create table posts (id serial primary key, title varchar(100), description varchar(255), content text, likes integer, price bigint, is_published boolean, published_at timestamp, created_at timestamp, updated_at timestamp);`,
  );
});

Deno.test("TableBuilder: smallIncrements", async () => {
  const builder = new TableBuilder("posts", {} as any);
  builder.smallIncrements("votes");

  isTableQueryValid(
    builder,
    "mysql",
    `create table posts (votes smallint auto_increment);`,
  );

  // This query actually doesn't work, since SQLite's auto increment system
  // only accepts the INTEGER type
  isTableQueryValid(
    builder,
    "sqlite",
    `create table posts (votes smallint autoincrement);`,
  );

  isTableQueryValid(
    builder,
    "postgres",
    `create table posts (votes smallserial);`,
  );
});

Deno.test("TableBuilder: bigIncrements", async () => {
  const builder = new TableBuilder("posts", {} as any);
  builder.bigIncrements("votes");

  isTableQueryValid(
    builder,
    "mysql",
    `create table posts (votes bigint auto_increment);`,
  );

  // This query actually doesn't work, since SQLite's auto increment system
  // only accepts the INTEGER type
  isTableQueryValid(
    builder,
    "sqlite",
    `create table posts (votes bigint autoincrement);`,
  );

  isTableQueryValid(
    builder,
    "postgres",
    `create table posts (votes bigserial);`,
  );
});
