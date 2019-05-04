import { addRoute, contextMenuClickAndConfirm, countRoutes } from './lib/common';
import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Create and delete routes', () => {
  tests.runHooks();

  it('Add a route', async () => {
    await countRoutes(3, tests);
    await addRoute(tests);
    await countRoutes(4, tests);
  });

  it('Remove 3 routes over 4', async () => {
    const menuTarget = '.menu-column--routes .menu-list .nav-item:first-of-type';

    await contextMenuClickAndConfirm(menuTarget, 3, tests);
    await contextMenuClickAndConfirm(menuTarget, 3, tests);
    await contextMenuClickAndConfirm(menuTarget, 3, tests);

    await countRoutes(1, tests);
  });

  it('Last added route should remain and be active', async () => {
    await tests.spectron.client.getText('.menu-column--routes .menu-list .nav-item:first-of-type .nav-link.active div:first-of-type').should.eventually.equal('GET\n/');
  });

  it('Remove last route, active tab should be environment settings', async () => {
    await contextMenuClickAndConfirm('.menu-column--routes .menu-list .nav-item:first-of-type', 3, tests);

    await countRoutes(0, tests);

    await tests.spectron.client.waitForExist('.header .btn[ngbTooltip="Environment settings"].active');
  });
});
