const Migrations = require('@mockoon/commons').Migrations;
const { readFileSync, writeFileSync } = require('fs');
const prettier = require('prettier');
const prettierConfig = require('../package.json').prettier;
const glob = require('glob');

/**
 * Use this script to migrate the tests sample environments. See ../test/data/README.md for more information.
 */

glob(
  './test/data/**/@(environment*|*v2|*v3).json',
  {
    ignore: [
      './test/data/import/new/**/*',
      './test/data/migrations/**/*',
      './test/data/schema-validation/**/*'
    ]
  },
  (error, files) => {
    files.forEach((file) => {
      const environment = JSON.parse(readFileSync(file).toString());

      console.log(`Starting migrating ${file}`);

      Migrations.forEach((migration) => {
        if (migration.id > environment.lastMigration) {
          migration.migrationFunction(environment);
          environment.lastMigration = migration.id;
        }
      });

      writeFileSync(
        file,
        prettier.format(
          JSON.stringify(environment),
          Object.assign(prettierConfig, {
            parser: 'json'
          })
        )
      );

      console.log(`Finished migrating ${file}`);
    });
  }
);
