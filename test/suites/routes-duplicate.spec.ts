import { Tests } from 'test/lib/tests';

describe('Duplicate a route', () => {
  const tests = new Tests('basic-data');

  it('Verify three routes', async () => {
    await tests.helpers.countRoutes(3);
  });

  it('Duplicate first route ', async () => {
    const menuTarget = '.routes-menu .menu-list .nav-item:first-of-type';
    await tests.helpers.contextMenuClick(menuTarget, 1);
    await tests.helpers.countRoutes(4);
  });

  it('Verify duplicated environment in second slot', async () => {
    await tests.helpers.waitElementExist(
      '.routes-menu .menu-list .nav-item:nth-of-type(2) .text-warning'
    );
  });
});
