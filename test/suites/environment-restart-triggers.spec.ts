import { Tests } from 'test/lib/tests';

describe('Environment "restart needed" indicator', () => {
  const tests = new Tests('basic-data');

  it('Start environment', async () => {
    await tests.helpers.startEnvironment();
  });

  it('Add a route and check that a restart is needed', async () => {
    await tests.helpers.addRoute();
    await tests.helpers.checkEnvironmentNeedsRestart();
    await tests.helpers.restartEnvironment();
  });

  it('Remove a route and check that a restart is needed', async () => {
    const menuTarget = '.routes-menu .menu-list .nav-item:first-of-type';
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 5);

    await tests.helpers.checkEnvironmentNeedsRestart();
  });
});
