#! /usr/bin/env deno test --allow-read --allow-net --allow-env test.ts

// Load .env file for database configurations
import "https://deno.land/x/dotenv@v0.4.0/load.ts";

import "./src/connect_test.ts";
import "./src/querybuilder_test.ts";
import "./src/adapter/sqlite_test.ts";
