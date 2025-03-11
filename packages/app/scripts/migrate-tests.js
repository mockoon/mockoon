// @ts-check
const Migrations = require('@mockoon/commons').Migrations;
const { readFileSync, writeFileSync } = require('fs');
const prettier = require('prettier');
const prettierConfig = require('../../../package.json').prettier;
const { glob } = require('glob');

/**
 * Use this script to migrate the tests sample environments. See ../test/data/README.md for more information.
 */

glob(
  [
    './test/data/mock-envs/*.json',
    './test/data/res/import-openapi/references/@(*v2|*v3).json',
    '../cli/test/data/envs/!(broken|repair)*'
  ],
  {
    ignore: [
      '**/mock-envs/{incompatible,migration,schema-broken,schema-broken-refs,schema-broken-repair}.json'
    ]
  }
).then((files) => {
  files.forEach((file) => {
    const environment = JSON.parse(readFileSync(file).toString());

    console.log(`Starting migrating ${file}`);

    Migrations.forEach((migration) => {
      if (migration.id > environment.lastMigration) {
        migration.migrationFunction(environment);
        environment.lastMigration = migration.id;
      }
    });

    prettier
      .format(
        JSON.stringify(environment),
        Object.assign(prettierConfig, {
          parser: 'json'
        })
      )
      .then((formatted) => {
        writeFileSync(file, formatted);
        console.log(`Finished migrating ${file}`);
      });
  });
});
