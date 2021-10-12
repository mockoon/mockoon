import { HighestMigrationId } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { Config } from 'src/renderer/app/config';
import { Tests } from 'test/lib/tests';

/**
 * New cases should only be added if the import system evolve, not if new migrations are added. Use migrations specs for this case.
 *
 * Only the new import format (>= 1.7.0) is tested. Old format test were removed for v1.16.0
 */

describe('Environments import', () => {
  describe('Import new format (>= 1.7.0)', () => {
    describe('Import environment without route from file', () => {
      const tests = new Tests('import', true, true, false);

      it('Should be able to import a single environment without route from a file', async () => {
        tests.helpers.mockDialog('showOpenDialog', [
          './test/data/import/new/env-no-route.json'
        ]);
        tests.helpers.mockDialog('showSaveDialog', [
          resolve('./tmp/storage/env-no-route.json')
        ]);

        tests.helpers.selectMenuEntry('IMPORT_FILE');

        await tests.app.client.pause(500);

        await tests.helpers.assertHasActiveEnvironment();
        await tests.helpers.countEnvironments(1);
        await tests.helpers.assertActiveEnvironmentName(
          'Environment without route'
        );
        await tests.helpers.startEnvironment();

        await tests.helpers.waitForAutosave();
        await tests.helpers.verifyObjectPropertyInFile(
          './tmp/storage/env-no-route.json',
          'name',
          'Environment without route'
        );
      });
    });

    describe('Environment import from file', () => {
      const tests = new Tests('import', true, true, false);
      it('Should be able to import multiple environments from the same file and migrate them', async () => {
        tests.helpers.mockDialog('showOpenDialog', [
          './test/data/import/new/full-export.json'
        ]);
        tests.helpers.mockDialog('showSaveDialog', [
          resolve('./tmp/storage/full-export-1.json'),
          resolve('./tmp/storage/full-export-2.json')
        ]);

        tests.helpers.selectMenuEntry('IMPORT_FILE');

        await tests.app.client.pause(500);

        await tests.helpers.assertHasActiveEnvironment();
        await tests.helpers.countEnvironments(2);
        await tests.helpers.assertActiveEnvironmentName('Import new format 2');
        await tests.helpers.startEnvironment();
        await tests.helpers.selectEnvironment(1);
        await tests.helpers.assertActiveEnvironmentName('Import new format 1');
        await tests.helpers.startEnvironment();

        await tests.helpers.waitForAutosave();
        await tests.helpers.verifyObjectPropertyInFile(
          './tmp/storage/full-export-1.json',
          'lastMigration',
          HighestMigrationId
        );
        await tests.helpers.verifyObjectPropertyInFile(
          './tmp/storage/full-export-2.json',
          'lastMigration',
          HighestMigrationId
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

        tests.helpers.mockDialog('showSaveDialog', [
          resolve('./tmp/storage/full-export-1.json'),
          resolve('./tmp/storage/full-export-2.json')
        ]);

        tests.helpers.selectMenuEntry('IMPORT_CLIPBOARD');

        await tests.app.client.pause(1000);

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

        tests.helpers.mockDialog('showSaveDialog', [
          resolve('./tmp/storage/route-export.json')
        ]);

        tests.helpers.selectMenuEntry('IMPORT_CLIPBOARD');

        await tests.app.client.pause(500);

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

        tests.helpers.selectMenuEntry('IMPORT_CLIPBOARD');

        await tests.app.client.pause(500);

        await tests.helpers.countEnvironments(0);
        await tests.helpers.countRoutes(0);
      });
    });
  });

  describe('Import with custom protocol mockoon://', () => {
    const tests = new Tests('import', true, true, false);

    it('should be able to import after a custom protocol URL was triggered', async () => {
      // custom protocol cannot be directly tested (click on a link, app launch, etc) and require the app to be packaged.
      tests.helpers.mockDialog('showSaveDialog', [
        resolve('./tmp/storage/notion.json')
      ]);
      tests.app.webContents.send('APP_CUSTOM_PROTOCOL', 'load-export-data', {
        url: 'https://raw.githubusercontent.com/mockoon/mock-samples/main/apis/notion.json'
      });
      await tests.app.client.pause(500);
      await tests.helpers.assertActiveEnvironmentName(
        'Notion API - Public Beta'
      );
    });
  });
});
