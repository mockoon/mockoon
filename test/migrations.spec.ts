import { expect } from 'chai';
import { promises as fs } from 'fs';
import { Settings } from 'src/app/services/settings.service';
import { Environments } from 'src/app/types/environment.type';
import { Tests } from './lib/tests';

describe('Environment migrations', () => {
  describe('Pre 1.7.0', () => {
    const filesPath = 'migrations/pre-1.7.0';
    const tests = new Tests(filesPath);

    tests.runHooks();

    it('Should add "lastMigration" property to the environment and remove it from the settings', async () => {
      // wait for post migration autosave
      await tests.spectron.client.pause(4000);

      const environmentFile = await fs.readFile(
        './tmp/storage/environments.json'
      );
      const environments: Environments = JSON.parse(environmentFile.toString());

      expect(environments[0].lastMigration).to.equal(9);

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
      await tests.spectron.client.pause(4000);

      const environmentFile = await fs.readFile(
        './tmp/storage/environments.json'
      );
      const environments: Environments = JSON.parse(environmentFile.toString());

      expect(environments[0].routes[0].responses[0].label).to.not.be.undefined;
    });
  });
});
