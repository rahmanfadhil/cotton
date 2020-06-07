#!/bin/bash

# format source code
deno fmt

docker-compose up --build --exit-code-from tests
