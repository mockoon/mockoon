import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

describe('Create and delete routes', () => {
  const tests = new Tests('basic-data');

  it('should add a route', async () => {
    await tests.helpers.countRoutes(3);
    await tests.helpers.addRoute();
    await tests.helpers.countRoutes(4);
  });

  it('should remove 3 routes over 4', async () => {
    const menuTarget = '.routes-menu .menu-list .nav-item:first-of-type';

    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 5);
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 5);
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 5);

    await tests.helpers.countRoutes(1);
  });

  it('should verify that last added route is active', async () => {
    const routeMethod = await tests.helpers.getElementText(
      '.routes-menu .menu-list .nav-item:first-of-type .nav-link.active .ellipsis:first-child'
    );
    expect(routeMethod).to.equal('GET\n/');
  });

  it('should display a message when no route is present', async () => {
    await tests.helpers.contextMenuClickAndConfirm(
      '.routes-menu .menu-list .nav-item:first-of-type',
      5
    );

    await tests.helpers.countRoutes(0);

    await tests.helpers.assertElementText(
      '.main-content .message',
      'No route defined'
    );
  });
});
