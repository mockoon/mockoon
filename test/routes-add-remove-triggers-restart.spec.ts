import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Creating and deleting routes should show "restart needed" indicator', () => {
  tests.runHooks();

  it('Start environment', async () => {
    await tests.helpers.startEnvironment();
  });

  it('Add a route and check that a restart is needed', async () => {
    await tests.helpers.addRoute();

    await tests.helpers.checkEnvironmentNeedsRestart();
    await tests.helpers.restartEnvironment();
  });

  it('Remove a route and check that a restart is needed', async () => {
    const menuTarget = '.menu-column--routes .menu-list .nav-item:first-of-type';
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 3);

    await tests.helpers.checkEnvironmentNeedsRestart();
  });
});
