* Run Local
   * CREDENTIALS_FILE=<credentials> CONFIG_FILE=<file with set information> ENDPOINT=http://localhost:8000 NODE_ENV=production IGNORE_IMAGES=1 npm start
* Run Remote
   * CREDENTIALS_FILE=<credentials> CONFIG_FILE<file with set information> npm start NODE_ENV=production npm start
* Recreate base databases
   * CREDENTIALS_FILE=<credentials> npm run recreate-base-tables
