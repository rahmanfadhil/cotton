#! /usr/bin/env deno test --allow-read --allow-net --allow-env test.ts

import { fileExists, dotenv } from "./deps.ts";

// Load .env file for database configurations
if (await fileExists("./.env")) {
  dotenv({ export: true });
}

import "./src/connect_test.ts";
import "./src/querybuilder_test.ts";
import "./src/adapter/sqlite_test.ts";
