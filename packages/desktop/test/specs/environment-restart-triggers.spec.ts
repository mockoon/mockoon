import contextMenu from '../libs/context-menu';
import environments from '../libs/environments';
import routes from '../libs/routes';

describe('Environment "restart needed" indicator', () => {
  it('should open and start the environment', async () => {
    await environments.open('basic-data');
    await environments.start();
  });

  it('should add a route and check that a restart is needed', async () => {
    await routes.add();
    await environments.assertNeedsRestart();
    await environments.restart();
  });

  it('should remove a route and check that a restart is needed', async () => {
    await contextMenu.clickAndConfirm('routes', 1, 5);

    await environments.assertNeedsRestart();
  });
});
