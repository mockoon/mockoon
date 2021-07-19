import { Tests } from 'test/lib/tests';

describe('Routes filter', async () => {
  const tests = new Tests('basic-data');
  const routesFilterSelector = 'input[id="route-filter"]';

  it('Filter route by name dolphins', async () => {
    await tests.helpers.countRoutes(3);
    await tests.helpers.setElementValue(routesFilterSelector, '/dolphins');
    await tests.app.client.pause(100);
    await tests.helpers.countRoutes(1);
  });

  it('Reset routes filter when clicking on the button Clear filter', async () => {
    await tests.helpers.elementClick('.btn[ngbTooltip="Clear filter"]');
    await tests.app.client.pause(100);
    await tests.helpers.countRoutes(3);
  });

  it('Reset routes filter when adding a new route', async () => {
    await tests.helpers.setElementValue(routesFilterSelector, '/dolphins');
    await tests.helpers.addRoute();
    await tests.helpers.assertElementValue(routesFilterSelector, '');
  });

  it('Reset routes filter when switching env', async () => {
    await tests.helpers.setElementValue(routesFilterSelector, '/dolphins');
    await tests.helpers.duplicateEnvironment(1);
    await tests.helpers.assertElementValue(routesFilterSelector, '');
  });

  it('Reset routes filter when duplicating route to selected environment', async () => {
    await tests.helpers.selectEnvironment(1);
    await tests.helpers.setElementValue(routesFilterSelector, '/dolphins');
    await tests.app.client.pause(100);
    await tests.helpers.countRoutes(1);
    await tests.helpers.contextMenuClick(
      '.routes-menu .menu-list .nav-item:first-child .nav-link',
      2
    );
    await tests.helpers.elementClick(
      '.modal-content .modal-body .list-group .list-group-item:first-child'
    );
    await tests.helpers.assertElementValue(routesFilterSelector, '');
  });

  it('Reset routes filter when adding a new environment', async () => {
    await tests.helpers.setElementValue(routesFilterSelector, '/dolphins');
    await tests.helpers.toggleEnvironmentMenu();
    await tests.helpers.addEnvironment();
    await tests.helpers.toggleEnvironmentMenu();
    await tests.helpers.assertElementValue(routesFilterSelector, '');
  });

  it('Reset routes filter when removing environment', async () => {
    await tests.helpers.setElementValue(routesFilterSelector, '/dolphins');
    await tests.helpers.removeEnvironment(3);
    await tests.helpers.assertElementValue(routesFilterSelector, '');
  });
});
