import { Config } from 'src/renderer/app/config';
import { Tests } from 'test/lib/tests';

describe('Changelog modal', () => {
  describe('Show changelog modal if last changelog shown is from older version', () => {
    const tests = new Tests('changelog-modal/shown', true, true, false);

    it('Should show the changelog modal', async () => {
      await tests.app.client.waitUntilTextExists(
        '.modal-title',
        `Release notes v${Config.appVersion}`
      );

      await tests.helpers.waitForAutosave();
    });

    it('Should save the current version as the last shown', async () => {
      await tests.helpers.closeModal();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'lastChangelog',
        Config.appVersion
      );
    });
  });

  describe('Do not show changelog modal if it is a fresh install', () => {
    const tests = new Tests(
      'changelog-modal/fresh-install',
      false,
      true,
      false
    );

    it('Should show the welcome modal only', async () => {
      await tests.helpers.countElements('.modal-dialog', 1);

      await tests.app.client.waitUntilTextExists(
        '.modal-title',
        'Welcome new Mockoon user!'
      );

      await tests.helpers.waitForAutosave();
    });

    it('Should have the current version as the last shown', async () => {
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'lastChangelog',
        Config.appVersion
      );
    });
  });

  describe('Do not show changelog modal if same version already shown', () => {
    const tests = new Tests('changelog-modal/shown', true, true, false, {
      lastChangelog: Config.appVersion
    });

    it('Should not show the changelog modal', async () => {
      await tests.helpers.waitElementExist('.modal-title', true);

      await tests.helpers.waitForAutosave();
    });

    it('Should still have the current version as the last shown', async () => {
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'lastChangelog',
        Config.appVersion
      );
    });
  });
});
