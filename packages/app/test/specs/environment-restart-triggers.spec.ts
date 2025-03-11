import environments from '../libs/environments';
import routes from '../libs/routes';
import utils, { DropdownMenuRouteActions } from '../libs/utils';

describe('Environment "restart needed" indicator', () => {
  it('should open and start the environment', async () => {
    await environments.open('basic-data');
    await environments.start();
  });

  it('should add a route and check that a restart is needed', async () => {
    await routes.addHTTPRoute();
    await utils.closeTooltip();
    await environments.assertNeedsRestart();
    await environments.restart();
  });

  it('should remove a route and check that a restart is needed', async () => {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuRouteActions.DELETE,
      true
    );

    await environments.assertNeedsRestart();
  });
});
