* Run Add series
   * CREDENTIALS_FILE=<credentials> CONFIG_FILE=<file with set information> ENDPOINT=http://localhost:8000 NODE_ENV=production IGNORE_IMAGES=1 npm start
* Recreate base databases
   * CREDENTIALS_FILE=<credentials> ENDPOINT=http://localhost:8000 npm run recreate_base_tables
* View Local Tables
   * CREDENTIALS_FILE=<credentials> TABLE_NAME=<table_name> ENDPOINT=http://localhost:8000 npm run view_tables

Remove ENDPOINT argument to run against dynamodb remote
