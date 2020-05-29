#! /usr/bin/env deno test --allow-read --allow-net --allow-env -c tsconfig.json test.ts

import "./src/connect_test.ts";
import "./src/querybuilder_test.ts";
import "./src/adapter/sqlite_test.ts";
import "./src/adapter/postgres_test.ts";
import "./src/adapter/mysql_test.ts";
import "./src/utils/date_test.ts";
import "./src/model_test.ts";
import "./src/baseadapter_test.ts";
