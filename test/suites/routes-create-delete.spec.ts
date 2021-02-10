import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

describe('Create and delete routes', () => {
  const tests = new Tests('basic-data');

  it('Add a route', async () => {
    await tests.helpers.countRoutes(3);
    await tests.helpers.addRoute();
    await tests.helpers.countRoutes(4);
  });

  it('Remove 3 routes over 4', async () => {
    const menuTarget = '.routes-menu .menu-list .nav-item:first-of-type';

    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 5);
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 5);
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 5);

    await tests.helpers.countRoutes(1);
  });

  it('Last added route should remain and be active', async () => {
    const routeMethod = await tests.helpers.getElementText(
      '.routes-menu .menu-list .nav-item:first-of-type .nav-link.active .ellipsis:first-child'
    );
    expect(routeMethod).to.equal('GET\n/');
  });

  it('Remove last route, active tab should be environment settings', async () => {
    await tests.helpers.contextMenuClickAndConfirm(
      '.routes-menu .menu-list .nav-item:first-of-type',
      5
    );

    await tests.helpers.countRoutes(0);

    await tests.helpers.waitElementExist(
      '.header .btn[ngbTooltip="Environment settings"].active'
    );
  });
});
