#! /usr/bin/env deno test --allow-read --allow-net --allow-env -c tsconfig.json test.ts

import "./src/connect_test.ts";
import "./src/querybuilder_test.ts";
import "./src/adapters/sqlite_test.ts";
import "./src/adapters/postgres_test.ts";
import "./src/adapters/mysql_test.ts";
import "./src/utils/date_test.ts";
import "./src/utils/number_test.ts";
import "./src/model_test.ts";
import "./src/adapters/adapter_test.ts";
