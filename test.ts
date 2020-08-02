#! /usr/bin/env deno test --allow-read --allow-net --allow-env -c tsconfig.json test.ts

// Integration tests
import "./src/connect_test.ts";
import "./src/adapters/sqlite_test.ts";
import "./src/adapters/postgres_test.ts";
import "./src/adapters/mysql_test.ts";
import "./src/adapters/adapter_test.ts";
import "./src/migrations/schema_test.ts";
import "./src/manager_test.ts";
import "./src/modelquery_test.ts";

// Unit tests
import "./src/utils/date_test.ts";
import "./src/utils/number_test.ts";
import "./src/utils/dialect_test.ts";
import "./src/utils/models_test.ts";
import "./src/querybuilder_test.ts";
import "./src/querycompiler_test.ts";
import "./src/migrations/tablebuilder_test.ts";
import "./src/migrations/columnbuilder_test.ts";
import "./src/migrations/foreign_test.ts";
import "./src/model_test.ts";
import "./src/basemodel_test.ts";
import "./src/serializers/serializer_test.ts";
import "./src/serializers/decorators/serializer_test.ts";
import "./src/serializers/serializers/typeserializer_test.ts";
import "./src/utils/serializers_test.ts";
