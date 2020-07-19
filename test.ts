#! /usr/bin/env deno test --allow-read --allow-net --allow-env -c tsconfig.json test.ts

// Integration tests
import "./src/connect_test.ts";
import "./src/adapters/sqlite_test.ts";
import "./src/adapters/postgres_test.ts";
import "./src/adapters/mysql_test.ts";
import "./src/adapters/adapter_test.ts";
import "./src/migrations/schema_test.ts";

// Unit tests
import "./src/utils/date_test.ts";
import "./src/utils/number_test.ts";
import "./src/utils/dialect_test.ts";
import "./src/utils/models_test.ts";
import "./src/manager_test.ts";
import "./src/querybuilder_test.ts";
import "./src/querycompiler_test.ts";
import "./src/migrations/tablebuilder_test.ts";
import "./src/migrations/column_test.ts";
import "./src/migrations/foreign_test.ts";
