import contextMenu from '../libs/context-menu';
import environments from '../libs/environments';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import utils from '../libs/utils';

describe('Create and delete routes', () => {
  it('should open the environment', async () => {
    await environments.open('basic-data');
  });

  it('should add a route and verify the header counter', async () => {
    await routes.assertCount(3);
    await navigation.assertHeaderValue('ENV_ROUTES', 'Routes 3');

    await routes.add();
    await routes.assertCount(4);
    await navigation.assertHeaderValue('ENV_ROUTES', 'Routes 4');
  });

  it('should remove 3 routes over 4', async () => {
    await contextMenu.clickAndConfirm('routes', 1, 6);
    await contextMenu.clickAndConfirm('routes', 1, 6);
    await contextMenu.clickAndConfirm('routes', 1, 6);

    await routes.assertCount(1);
  });

  it('should display a message when no route is present', async () => {
    await contextMenu.clickAndConfirm('routes', 1, 6);
    await routes.assertCount(0);
    await navigation.assertHeaderValue('ENV_ROUTES', 'Routes');

    await utils.assertElementText(
      $('.main-content .message'),
      'No route defined'
    );
  });
});
