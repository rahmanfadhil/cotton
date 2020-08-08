#!/bin/bash

# format source code
deno fmt

# run the tests 
docker-compose up --build --exit-code-from tests
