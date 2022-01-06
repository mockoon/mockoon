import contextMenu from '../libs/context-menu';
import environments from '../libs/environments';
import routes from '../libs/routes';
import utils from '../libs/utils';

describe('Create and delete routes', () => {
  it('should open the environment', async () => {
    await environments.open('basic-data');
  });

  it('should add a route and verify the header counter', async () => {
    await routes.assertCount(3);
    await utils.assertElementText(environments.routesTab, 'Routes 3');

    await routes.add();
    await routes.assertCount(4);
    await utils.assertElementText(environments.routesTab, 'Routes 4');
  });

  it('should remove 3 routes over 4', async () => {
    await contextMenu.clickAndConfirm('routes', 1, 5);
    await contextMenu.clickAndConfirm('routes', 1, 5);
    await contextMenu.clickAndConfirm('routes', 1, 5);

    await routes.assertCount(1);
  });

  it('should display a message when no route is present', async () => {
    await contextMenu.clickAndConfirm('routes', 1, 5);
    await routes.assertCount(0);
    await utils.assertElementText(environments.routesTab, 'Routes');

    await utils.assertElementText(
      $('.main-content .message'),
      'No route defined'
    );
  });
});
