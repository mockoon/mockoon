import { Tests } from 'test/lib/tests';

describe('First load', () => {
  const tests = new Tests('first-load', true, true, false, {
    welcomeShown: false
  });

  it('Open window with Mockoon title', async () => {
    await tests.app.webContents.getTitle().should.eventually.equal('Mockoon');
  });

  it('Show welcome modal', async () => {
    await tests.app.client.waitUntilTextExists(
      '.modal-title',
      'Welcome new Mockoon user!'
    );
  });

  it('Close welcome modal, check for persistence', async () => {
    await tests.helpers.closeModal();

    await tests.helpers.waitForAutosave();

    await tests.helpers.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      'welcomeShown',
      true
    );
  });

  it('Verify demo environment presence and file', async () => {
    await tests.helpers.assertHasActiveEnvironment('Demo API');
    await tests.helpers.verifyObjectPropertyInFile(
      './tmp/storage/demo.json',
      'name',
      'Demo API'
    );
  });
});
