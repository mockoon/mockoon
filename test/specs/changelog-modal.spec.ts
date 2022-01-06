import { Config } from '../../src/shared/config';
import file from '../libs/file';
import modals from '../libs/modals';
import utils from '../libs/utils';

describe('Changelog modal', () => {
  describe('should show changelog modal if last changelog shown is from older version', () => {
    before(async () => {
      await file.editSettings({
        lastChangelog: '1.0.0'
      });
      await browser.reloadSession();
    });

    it('should show the changelog modal', async () => {
      await modals.assertTitle(`Release notes v${Config.appVersion}`);
      await utils.waitForAutosave();
    });

    it('should save the current version as the last shown', async () => {
      await modals.close();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'lastChangelog',
        Config.appVersion
      );
    });
  });

  describe('Do not show changelog modal if it is a fresh install', () => {
    before(async () => {
      await file.editSettings({
        lastChangelog: Config.appVersion,
        welcomeShown: false
      });
      await browser.reloadSession();
    });

    it('should show the welcome modal only', async () => {
      await utils.countElements($$('.modal-dialog'), 1);
      await modals.assertTitle('Welcome new Mockoon user!');
      await utils.waitForAutosave();
    });

    it('should have the current version as the last shown', async () => {
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'lastChangelog',
        Config.appVersion
      );
    });
  });

  describe('Do not show changelog modal if same version already shown', () => {
    before(async () => {
      await file.editSettings({
        lastChangelog: Config.appVersion
      });
      await browser.reloadSession();
    });

    it('should not show the changelog modal', async () => {
      await modals.assertExists();

      await utils.waitForAutosave();
    });

    it('should still have the current version as the last shown', async () => {
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'lastChangelog',
        Config.appVersion
      );
    });
  });
});
