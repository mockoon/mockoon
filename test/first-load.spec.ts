import { Tests } from './lib/tests';

const tests = new Tests('first-load');

describe('First load', () => {
  tests.runHooks(false);
  tests.waitForWindowReady();

  it('Open window with Mockoon title', async () => {
    await tests.spectron.webContents.getTitle().should.eventually.equal('Mockoon');
  });

  it('Show welcome modal', async () => {
    await tests.spectron.client.waitUntilTextExists('.modal-title', 'Welcome new Mockoon user!');
  });

  it('Close welcome modal', async () => {
    await tests.spectron.client.element('.modal-footer .btn').click();
  });
});
