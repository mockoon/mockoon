import contextMenu, { ContextMenuRouteActions } from '../libs/context-menu';
import environments from '../libs/environments';
import routes from '../libs/routes';

describe('Duplicate a route', () => {
  it('should open the environment', async () => {
    await environments.open('basic-data');
  });

  it('should verify three routes', async () => {
    await routes.assertCount(3);
  });

  it('should duplicate first route ', async () => {
    await contextMenu.click('routes', 1, ContextMenuRouteActions.DUPLICATE);
    await routes.assertCount(4);
  });

  it('should verify duplicated environment in second slot', async () => {
    await $(
      '.routes-menu .menu-list .nav-item:nth-of-type(4) .text-warning[ngbTooltip="Route is duplicated (same endpoint and method)"]'
    ).waitForExist();
  });
});
