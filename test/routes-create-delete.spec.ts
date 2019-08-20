import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Create and delete routes', () => {
  tests.runHooks();

  it('Add a route', async () => {
    await tests.helpers.countRoutes(3);
    await tests.helpers.addRoute();
    await tests.helpers.countRoutes(4);
  });

  it('Remove 3 routes over 4', async () => {
    const menuTarget = '.menu-column--routes .menu-list .nav-item:first-of-type';

    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 3);
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 3);
    await tests.helpers.contextMenuClickAndConfirm(menuTarget, 3);

    await tests.helpers.countRoutes(1);
  });

  it('Last added route should remain and be active', async () => {
    await tests.spectron.client.getText('.menu-column--routes .menu-list .nav-item:first-of-type .nav-link.active div:first-of-type').should.eventually.equal('GET\n/');
  });

  it('Remove last route, active tab should be environment settings', async () => {
    await tests.helpers.contextMenuClickAndConfirm('.menu-column--routes .menu-list .nav-item:first-of-type', 3);

    await tests.helpers.countRoutes(0);

    await tests.spectron.client.waitForExist('.header .btn[ngbTooltip="Environment settings"].active');
  });
});
