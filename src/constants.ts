/**
 * A map of all available metadata names you can set or retrieve
 */
export const metadata = {
  tableName: "db:tablename",
  columns: "db:columns",
  relations: "db:relations",
  jsonProperties: "db:jsonproperties",
};

// Inspired by deno-nessie from @halvardssm
// https://github.com/halvardssm/deno-nessie
export const COLUMN_TYPES = {
  bigIncrements: {
    postgres: "bigserial",
    mysql: "bigint",
    sqlite: "integer",
  },
  bigInteger: {
    postgres: "bigint",
    mysql: "bigint",
    sqlite: "bigint",
  },
  binary: {
    postgres: "bytea",
    mysql: "longblob",
    sqlite: "blob",
  },
  bit: {
    postgres: "bit",
    mysql: "bit",
    sqlite: "blob",
  },
  boolean: {
    postgres: "boolean",
    mysql: "tinyint",
    sqlite: "boolean",
  },
  increments: {
    postgres: "serial",
    mysql: "integer",
    sqlite: "integer",
  },
  integer: {
    postgres: "integer",
    mysql: "integer",
    sqlite: "integer",
  },
  smallIncrements: {
    postgres: "smallserial",
    mysql: "smallint",
    sqlite: "integer",
  },
  smallInteger: {
    postgres: "smallint",
    mysql: "smallint",
    sqlite: "smallint",
  },
  real: {
    postgres: "real",
    mysql: "float",
    sqlite: "float",
  },
  double: {
    postgres: "float8",
    mysql: "double",
    sqlite: "double",
  },
  numeric: {
    postgres: "numeric",
    mysql: "numeric",
    sqlite: "decimal",
  },
  money: {
    postgres: "money",
    mysql: "decimal",
    sqlite: "decimal",
  },
  char: {
    postgres: "char",
    mysql: "char",
    sqlite: "char",
  },
  varchar: {
    postgres: "varchar",
    mysql: "varchar",
    sqlite: "varchar",
  },
  text: {
    postgres: "text",
    mysql: "longtext",
    sqlite: "text",
  },
  jsonb: {
    postgres: "jsonb",
    mysql: "json",
    sqlite: "json",
  },
  date: {
    postgres: "date",
    mysql: "date",
    sqlite: "date",
  },
  datetime: {
    postgres: "timestamp",
    mysql: "datetime",
    sqlite: "datetime",
  },
  time: {
    postgres: "time",
    mysql: "time",
    sqlite: "time",
  },
  timeTz: {
    postgres: "timetz",
    mysql: "time",
    sqlite: "time",
  },
  timestamp: {
    postgres: "timestamp",
    mysql: "timestamp",
    sqlite: "timestamp",
  },
  timestampTz: {
    postgres: "timestamptz",
    mysql: "datetime",
    sqlite: "datetime",
  },
};
