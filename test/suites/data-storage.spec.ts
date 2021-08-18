import { Tests } from 'test/lib/tests';

describe('Data storage', () => {
  describe('Settings environment list with file missing', () => {
    const tests = new Tests('data-storage');

    it('should clean the settings environment list', async () => {
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        ['environments.0.uuid', 'environments.1.uuid'],
        [
          '6f2d0c0b-cf7b-494d-9080-8d614bf761db',
          '6d67bab2-886e-4635-9f9b-8bc1983c49c0'
        ]
      );
      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        ['environments.0.uuid', 'environments.1'],
        ['6d67bab2-886e-4635-9f9b-8bc1983c49c0', undefined]
      );
    });

    it('should load one environment', async () => {
      await tests.helpers.assertHasActiveEnvironment('FT env');
      await tests.helpers.countEnvironments(1);
    });
  });
});
