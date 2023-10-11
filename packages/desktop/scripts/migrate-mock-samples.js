const Migrations = require('@mockoon/commons').Migrations;
const { readFileSync, writeFileSync, existsSync, statSync } = require('fs');
const prettier = require('prettier');
const prettierConfig = require('../../../package.json').prettier;
const glob = require('glob');

/**
 * Use this script to migrate the mockoon samples in mockoon-sample environments.
 * Run `node migrate-mock-samples path/to/mockoon-sample`.
 */

async function migrateFiles(directoryPath) {
  try {
    // Check if the provided argument is a valid directory
    if (!existsSync(directoryPath) || !statSync(directoryPath).isDirectory()) {
      console.error(
        `"${directoryPath}" is not a valid mock-samples directory.`
      );
      return;
    }
    const dataFiles = glob.sync(`${directoryPath}/mock-apis/data/*.json`);
    const sampleFiles = glob.sync(`${directoryPath}/samples/*.json`);
    const files = [...dataFiles, ...sampleFiles];

    for (const file of files) {
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
        await prettier.format(
          JSON.stringify(environment),
          Object.assign(prettierConfig, {
            parser: 'json'
          })
        )
      );

      console.log(`Finished migrating ${file}`);
    }
  } catch (error) {
    console.error(error);
  }
}

// Check if a directory path argument is provided
if (process.argv.length < 3) {
<<<<<<< HEAD
  console.error(
    'Please provide the mockoon-samples repository path as an argument and run again.'
  );
=======
  console.error('Please provide a directory path as an argument.');
>>>>>>> 264be0da95eb3366fcdcf0751f9c68ba130e1875
} else {
  const directoryPath = process.argv[2];
  migrateFiles(directoryPath);
}
