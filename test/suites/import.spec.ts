import { HighestMigrationId } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { Config } from 'src/app/config';
import { Tests } from 'test/lib/tests';

/**
 * These test cases covers imports from old exported files < 1.7.0, and import of data exported with the new system > 1.7.0
 * New cases should only be added if the import system evolve, not if new migrations are added. Use migrations specs for this case.
 */

const oldImportCases = [
  {
    desc: 'v1.4.0',
    exportFile: './test/data/import/old/1.4.0.json',
    environmentTitle: 'Import old v1.4.0'
  },
  {
    desc: 'v1.5.0',
    exportFile: './test/data/import/old/1.5.0.json',
    environmentTitle: 'Import old v1.5.0'
  },
  {
    desc: 'v1.5.1',
    exportFile: './test/data/import/old/1.5.1.json',
    environmentTitle: 'Import old v1.5.1'
  },
  {
    desc: 'v1.6.0',
    exportFile: './test/data/import/old/1.6.0.json',
    environmentTitle: 'Import old v1.6.0'
  },
  {
    desc: 'v1.6.0 with single environment',
    exportFile: './test/data/import/old/1.6.0-single-env.json',
    environmentTitle: 'Import old v1.6.0 single env'
  }
];

describe('Environments import', () => {
  describe('Import from older version (< 1.7.0)', () => {
    oldImportCases.forEach((testCase) => {
      describe(testCase.desc, () => {
        const tests = new Tests('import', true, true, false);

        it('Should import the export file', async () => {
          tests.ipcRenderer.sendSync('SPECTRON_FAKE_DIALOG', [
            {
              method: 'showOpenDialog',
              value: { filePaths: [testCase.exportFile] }
            }
          ]);

          tests.helpers.sendWebContentsAction('IMPORT_FILE');

          await tests.helpers.assertHasActiveEnvironment();
          await tests.helpers.assertActiveEnvironmentName(
            testCase.environmentTitle
          );

          await tests.helpers.startEnvironment();

          await tests.helpers.waitForAutosave();

          await tests.helpers.verifyObjectPropertyInFile(
            './tmp/storage/environments.json',
            '0.lastMigration',
            HighestMigrationId
          );
        });
      });
    });

    describe('v1.6.0 with single route', () => {
      const tests = new Tests('import', true, true, false);

      it('Should reject the export file when version is different', async () => {
        tests.ipcRenderer.sendSync('SPECTRON_FAKE_DIALOG', [
          {
            method: 'showOpenDialog',
            value: {
              filePaths: ['./test/data/import/old/1.6.0-single-route.json']
            }
          }
        ]);

        tests.helpers.sendWebContentsAction('IMPORT_FILE');

        await tests.helpers.countEnvironments(0);
        await tests.helpers.countRoutes(0);

        await tests.helpers.waitForAutosave();

        await tests.helpers.verifyObjectPropertyInFile(
          './tmp/storage/environments.json',
          '0',
          undefined
        );
      });
    });
  });

  describe('Import new format (>= 1.7.0)', () => {
    describe('Environment import from file', () => {
      const tests = new Tests('import', true, true, false);

      it('Should be able to import multiple environments from the same file and migrate them', async () => {
        tests.ipcRenderer.sendSync('SPECTRON_FAKE_DIALOG', [
          {
            method: 'showOpenDialog',
            value: { filePaths: ['./test/data/import/new/full-export.json'] }
          }
        ]);

        tests.helpers.sendWebContentsAction('IMPORT_FILE');

        await tests.helpers.assertHasActiveEnvironment();
        await tests.helpers.countEnvironments(2);
        await tests.helpers.assertActiveEnvironmentName('Import new format 2');
        await tests.helpers.startEnvironment();
        await tests.helpers.selectEnvironment(1);
        await tests.helpers.assertActiveEnvironmentName('Import new format 1');
        await tests.helpers.startEnvironment();

        await tests.helpers.waitForAutosave();
        await tests.helpers.verifyObjectPropertyInFile(
          './tmp/storage/environments.json',
          ['0.lastMigration', '1.lastMigration'],
          [HighestMigrationId, HighestMigrationId]
        );
      });
    });

    describe('Multiple environments import from clipboard', () => {
      const tests = new Tests('import', true, true, false);

      it('Should import an environment from clipboard', async () => {
        const fileContent = await fs.readFile(
          './test/data/import/new/full-export.json',
          'utf-8'
        );
        tests.app.electron.clipboard.writeText(fileContent);

        tests.helpers.sendWebContentsAction('IMPORT_CLIPBOARD');

        await tests.helpers.assertHasActiveEnvironment();
        await tests.helpers.assertActiveEnvironmentName('Import new format 2');

        await tests.helpers.startEnvironment();
      });
    });

    describe('Route import from clipboard - same version', () => {
      const tests = new Tests('import', true, true, false);

      it('Should import a route from clipboard and create an environment if has none', async () => {
        const fileContent = await fs.readFile(
          './test/data/import/new/route-export.json',
          'utf-8'
        );

        tests.app.electron.clipboard.writeText(
          fileContent.replace('##appVersion##', Config.appVersion)
        );

        tests.helpers.sendWebContentsAction('IMPORT_CLIPBOARD');

        await tests.helpers.assertHasActiveEnvironment();
        await tests.helpers.assertActiveEnvironmentName('New environment');
        await tests.helpers.checkActiveRoute('GET\n/answer');
        await tests.helpers.startEnvironment();
      });
    });

    describe('Route import from clipboard - different version', () => {
      const tests = new Tests('import', true, true, false);

      it('Should reject a route if version is different', async () => {
        const fileContent = await fs.readFile(
          './test/data/import/new/route-export.json',
          'utf-8'
        );

        tests.app.electron.clipboard.writeText(
          fileContent.replace('##appVersion##', '0.0.0')
        );

        tests.helpers.sendWebContentsAction('IMPORT_CLIPBOARD');

        await tests.helpers.countEnvironments(0);
        await tests.helpers.countRoutes(0);
      });
    });
  });
});
