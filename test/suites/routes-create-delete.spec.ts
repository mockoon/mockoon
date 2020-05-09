import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

const tests = new Tests('basic-data');

describe('Create and delete routes', () => {
  tests.runHooks();

  it('Add a route', async () => {
    await tests.helpers.countRoutes(3);
    await tests.helpers.addRoute();
    await tests.helpers.countRoutes(4);
  });

  it('Remove 3 routes over 4', async () => {
    const menuTarget = '.routes-menu .menu-list .nav-item:first-of-type';

    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 4);
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 4);
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 4);

    await tests.helpers.countRoutes(1);
  });

  it('Last added route should remain and be active', async () => {
    const routeMethod = await tests.app.client.getText(
      '.routes-menu .menu-list .nav-item:first-of-type .nav-link.active .ellipsis:first-child'
    );
    expect(routeMethod).to.equal('GET\n/');
  });

  it('Remove last route, active tab should be environment settings', async () => {
    await tests.helpers.contextMenuClickAndConfirm(
      '.routes-menu .menu-list .nav-item:first-of-type',
      4
    );

    await tests.helpers.countRoutes(0);

    await tests.app.client.waitForExist(
      '.header .btn[ngbTooltip="Environment settings"].active'
    );
  });
});
