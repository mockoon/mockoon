import environments from '../libs/environments';
import file from '../libs/file';
import modals from '../libs/modals';
import utils from '../libs/utils';

describe('First load', () => {
  before(async () => {
    await file.editSettings({
      welcomeShown: false,
      environments: undefined
    });
    await browser.reloadSession();
  });

  it('Open window with Mockoon title', async () => {
    expect(await browser.getTitle()).toEqual('Mockoon');
  });

  it('Show welcome modal', async () => {
    await modals.assertExists();
    await modals.assertTitle('Welcome new Mockoon user!');
  });

  it('Close welcome modal, check for persistence', async () => {
    await modals.close();

    await utils.waitForAutosave();

    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      'welcomeShown',
      true
    );
  });

  it('Verify demo environment presence and file', async () => {
    await environments.assertActiveMenuEntryText('Demo API');
    await file.verifyObjectPropertyInFile(
      './tmp/storage/demo.json',
      'name',
      'Demo API'
    );
  });
});
