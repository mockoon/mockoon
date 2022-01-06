import environments from '../libs/environments';
import file from '../libs/file';
import utils from '../libs/utils';

describe('Environments migrations', () => {
  it('should open the environment', async () => {
    await environments.open('migration');
  });

  it('should apply migration 19', async () => {
    await utils.waitForAutosave();

    await file.verifyObjectPropertyInFile(
      './tmp/storage/migration.json',
      [
        'https',
        'tlsOptions.enabled',
        'tlsOptions.pfxPath',
        'tlsOptions.certPath',
        'tlsOptions.keyPath',
        'tlsOptions.caPath',
        'tlsOptions.passphrase'
      ],
      [undefined, true, '', '', '', '', '']
    );
  });
});
