import { Tests } from 'test/lib/tests';

const tests = new Tests('basic-data');

describe('Environment restart triggers', () => {
  describe('Creating and deleting routes should show "restart needed" indicator', () => {
    tests.runHooks();

    it('Start environment', async () => {
      await tests.helpers.startEnvironment();
    });

    it('Add a route and check that a restart is needed', async () => {
      await tests.app.client.moveTo(null, 100, 0);
      await tests.helpers.addRoute();

      await tests.helpers.checkEnvironmentNeedsRestart();
      await tests.helpers.restartEnvironment();
    });

    it('Remove a route and check that a restart is needed', async () => {
      const menuTarget = '.routes-menu .menu-list .nav-item:first-of-type';
      await tests.helpers.contextMenuClickAndConfirm(menuTarget, 4);

      await tests.helpers.checkEnvironmentNeedsRestart();
    });
  });
});
