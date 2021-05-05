const Migrations = require('@mockoon/commons').Migrations;
const { readFileSync, writeFileSync } = require('fs');
const prettier = require('prettier');
const prettierConfig = require('../package.json').prettier;

/**
 * Use this script to migrate the tests sample environments. See ../test/data/README.md for more information.
 */

const files = [
  './test/data/basic-data/environments.json',
  './test/data/environment-logs/environments.json',
  './test/data/export/environments.json',
  './test/data/export-openapi/environments.json',
  './test/data/headers/environments.json',
  './test/data/import/environments.json',
  './test/data/import/openapi/references/aws-cloudfront-v3.json',
  './test/data/import/openapi/references/aws-server-v3.json',
  './test/data/import/openapi/references/custom-schema-no-prefix-v2.json',
  './test/data/import/openapi/references/custom-schema-no-prefix-v3.json',
  './test/data/import/openapi/references/custom-schema-v2.json',
  './test/data/import/openapi/references/custom-schema-v3.json',
  './test/data/import/openapi/references/datagov-v2.json',
  './test/data/import/openapi/references/giphy-v2.json',
  './test/data/import/openapi/references/github-v2.json',
  './test/data/import/openapi/references/petstore-v2.json',
  './test/data/import/openapi/references/petstore-v3.json',
  './test/data/import/openapi/references/shutterstock-v3.json',
  './test/data/import/openapi/references/slack-v2.json',
  './test/data/import/openapi/references/youtube-v3.json',
  './test/data/proxy/environments.json',
  './test/data/responses-rules/environments.json',
  './test/data/settings/environments.json',
  './test/data/templating/environments.json',
  './test/data/ui/environments.json'
];

files.forEach((file) => {
  const environments = JSON.parse(readFileSync(file).toString());

  console.log(`Starting migrating ${file}`);

  environments.forEach((environment) => {
    Migrations.forEach((migration) => {
      if (migration.id > environment.lastMigration) {
        migration.migrationFunction(environment);
        environment.lastMigration = migration.id;
      }
    });
  });

  writeFileSync(
    file,
    prettier.format(
      JSON.stringify(environments),
      Object.assign(prettierConfig, {
        parser: 'json'
      })
    )
  );

  console.log(`Finished migrating ${file}`);
});
