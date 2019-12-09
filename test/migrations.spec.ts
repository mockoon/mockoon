import { expect } from 'chai';
import { promises as fs } from 'fs';
import { Settings } from 'src/app/services/settings.service';
import { Tests } from './lib/tests';

describe('Environments migrations', () => {
  describe('Pre 1.7.0', () => {
    const filesPath = 'migrations/pre-1.7.0';
    const tests = new Tests(filesPath, true);

    tests.runHooks();

    it('Should add "lastMigration" property to the environment and remove it from the settings', async () => {
      // wait for post migration autosave
      await tests.app.client.pause(4000);

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environments.json',
        '0.lastMigration',
        9
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
      // wait for post migration autosave
      await tests.app.client.pause(4000);

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environments.json',
        '0.routes.0.responses.0.label',
        null,
        true
      );
    });
  });
});
