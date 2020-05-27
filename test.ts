#! /usr/bin/env deno test --allow-read --allow-net --allow-env -c tsconfig.json test.ts

import { dotenv, fileExistsSync } from "./testdeps.ts";

// Load .env file if exists
if (fileExistsSync("./.env")) {
  dotenv({ export: true });
}

import "./src/connect_test.ts";
import "./src/querybuilder_test.ts";
import "./src/adapter/sqlite_test.ts";
import "./src/manager_test.ts";
import "./src/utils/date_test.ts";
