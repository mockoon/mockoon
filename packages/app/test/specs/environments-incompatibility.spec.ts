import environments from '../libs/environments';
import file from '../libs/file';
import utils from '../libs/utils';

describe('Environments incompatibility', () => {
  it('should try to open the app with an incompatible environment which should be ignored', async () => {
    await environments.assertCount(0);
    await utils.waitForAutosave();

    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      ['environments.0'],
      [undefined]
    );
  });

  it('should be unable to open an incompatible environment', async () => {
    await environments.open('incompatible', false);
    await utils.checkToastDisplayed(
      'warning',
      'Environment "FT env" was created with a more recent version of Mockoon. Please upgrade.'
    );
    await utils.closeToast();
  });
});
