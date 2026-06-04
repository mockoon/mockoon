import environments from '../libs/environments';
import routes from '../libs/routes';
import utils, { DropdownMenuRouteActions } from '../libs/utils';

describe('Duplicate a route', () => {
  it('should open the environment', async () => {
    await environments.open('basic-data');
  });

  it('should verify three routes', async () => {
    await routes.assertCount(3);
  });

  it('should duplicate first route ', async () => {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuRouteActions.DUPLICATE
    );
    await routes.assertCount(4);
  });

  it('should verify duplicated environment in second slot', async () => {
    await $(
      '.routes-menu .menu-list .nav-item:nth-of-type(4) .text-warning[ngbTooltip="Route is duplicated (same endpoint and method)"]'
    ).waitForExist();
  });

  describe('Batch duplicate multiple routes', () => {
    it('should ctrl-click to multi-select three routes', async () => {
      await routes.ctrlSelect(1);
      await routes.ctrlSelect(2);
      await routes.ctrlSelect(3);
      await routes.assertBatchSelectionCount(3);
    });

    it('should batch duplicate selected routes in place', async () => {
      await routes.batchDuplicate();
      // 4 + 3 = 7
      await routes.assertCount(7);
    });
  });
});
