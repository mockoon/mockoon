import environments from '../libs/environments';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import utils, { DropdownMenuRouteActions } from '../libs/utils';

describe('Create and delete routes', () => {
  it('should open the environment', async () => {
    await environments.open('basic-data');
  });

  it('should add a route and verify the header counter', async () => {
    await routes.assertCount(3);
    await navigation.assertHeaderValue('ENV_ROUTES', 'Routes 3');

    await routes.addHTTPRoute();
    await routes.assertCount(4);
    await navigation.assertHeaderValue('ENV_ROUTES', 'Routes 4');
  });

  it('should remove 3 routes over 4', async () => {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuRouteActions.DELETE,
      true
    );
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuRouteActions.DELETE,
      true
    );
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuRouteActions.DELETE,
      true
    );

    await routes.assertCount(1);
  });

  it('should display a message when no route is present', async () => {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuRouteActions.DELETE,
      true
    );

    await routes.assertCount(0);
    await navigation.assertHeaderValue('ENV_ROUTES', 'Routes');

    await utils.assertElementText(
      $('.main-content .message'),
      'No route defined'
    );
  });
});
