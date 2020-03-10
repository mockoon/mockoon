import { Tests } from './lib/tests';

const tests = new Tests('first-load', true);

describe('First load', () => {
  tests.runHooks(false, false);
  tests.waitForWindowReady();

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
    await tests.app.client.element('.modal-footer .btn').click();

    // wait for settings save
    await tests.app.client.pause(1000);
    await tests.helpers.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      'welcomeShown',
      true
    );
  });
});
