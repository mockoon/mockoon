import { expect } from 'chai';
import { promises as fs } from 'fs';
import { HighestMigrationId } from 'src/app/libs/migrations.lib';
import { Settings } from 'src/app/models/settings.model';
import { Tests } from 'test/lib/tests';

describe('Environments migrations', () => {
  describe('Pre 1.7.0', () => {
    const filesPath = 'migrations/pre-1.7.0';
    const tests = new Tests(filesPath, true);

    tests.runHooks();

    it('Should add "lastMigration" property to the environment and remove it from the settings', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environments.json',
        '0.lastMigration',
        HighestMigrationId
      );

      const settingsFile = await fs.readFile('./tmp/storage/settings.json');
      const settings: Settings & { lastMigration: number } = JSON.parse(
        settingsFile.toString()
      );

      expect(settings.lastMigration).to.be.undefined;
    });
  });

  describe('No. 9', () => {
    const filesPath = 'migrations/9';
    const tests = new Tests(filesPath);

    tests.runHooks();

    it('Should add "label" property to route responses', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environments.json',
        '0.routes.0.responses.0.label',
        null,
        true
      );
    });
  });

  describe('No. 10', () => {
    const filesPath = 'migrations/10';
    const tests = new Tests(filesPath);

    tests.runHooks();

    it('Should add "proxyReqHeaders" and "proxyResHeaders" headers properties to environments', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environments.json',
        ['0.proxyReqHeaders.0.key', '0.proxyResHeaders.0.key'],
        null,
        true
      );
    });
  });
});
