import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Environment start/stop/restart', () => {
  tests.runHooks();

  tests.waitForWindowReady();
  tests.waitForEnvironmentLoaded();

  it('Start default selected environment', async () => {
    await tests.spectron.client.element('.btn i[ngbtooltip="Start server"]').click();
    await tests.spectron.client.waitForExist('.menu-columns:first-of-type .menu-list .nav-item .nav-link.running', 5000);
  });

  it('Stop default selected environment', async () => {
    await tests.spectron.client.element('.btn i[ngbtooltip="Stop server"]').click();
    await tests.spectron.client.waitForExist('.menu-columns:first-of-type .menu-list .nav-item .nav-link.running', 5000, true);
  });
});
