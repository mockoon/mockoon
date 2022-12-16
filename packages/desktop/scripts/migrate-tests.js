const Migrations = require('@mockoon/commons').Migrations;
const { readFileSync, writeFileSync } = require('fs');
const prettier = require('prettier');
const prettierConfig = require('../../../package.json').prettier;
const glob = require('glob');

/**
 * Use this script to migrate the tests sample environments. See ../test/data/README.md for more information.
 */

glob(
  `{./test/data/mock-envs/*.json,./test/data/res/import-openapi/references/@(*v2|*v3).json}`,
  {
    ignore: [
      './test/data/mock-envs/incompatible.json',
      './test/data/mock-envs/migration.json',
      './test/data/mock-envs/schema-broken.json',
      './test/data/mock-envs/schema-broken-refs.json',
      './test/data/mock-envs/schema-broken-repair.json'
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
