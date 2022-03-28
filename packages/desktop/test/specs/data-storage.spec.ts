import environments from '../libs/environments';
import file from '../libs/file';
import utils from '../libs/utils';

describe('Data storage', () => {
  describe('Settings environment list with file missing', () => {
    before(async () => {
      await file.editSettings({
        environments: [
          { uuid: '6f2d0c0b-cf7b-494d-9080-8d614bf761db', path: 'wrongpath' }
        ]
      });
      await browser.reloadSession();
    });

    it('should open the environment', async () => {
      await environments.open('data-storage');
    });

    it('should clean the settings environment list', async () => {
      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        ['environments.0.uuid', 'environments.1'],
        ['6d67bab2-886e-4635-9f9b-8bc1983c49c0', undefined]
      );
    });

    it('should load one environment', async () => {
      await environments.assertCount(1);
      await environments.assertActiveMenuEntryText('FT env');
    });
  });
});
