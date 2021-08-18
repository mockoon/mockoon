import { expect } from 'chai';
import { resolve } from 'path';
import { Tests } from 'test/lib/tests';

describe('Routes filter', () => {
  const tests = new Tests('basic-data');
  const routesFilterSelector = 'input[id="route-filter"]';

  it('should get focused when pressing ctrl + shift + f', async () => {
    const routeFilter = await tests.helpers.getElement(routesFilterSelector);
    await tests.app.client.keys(['Control', 'Shift', 'f']);
    // disable ctrl and shift
    expect(await routeFilter.isFocused()).to.equal(true);
    await tests.app.client.keys(['Control', 'Shift']);
  });

  it('should get cleared when pressing escape while focused', async () => {
    const routeFilter = await tests.helpers.getElement(routesFilterSelector);
    await tests.helpers.setElementValue(routesFilterSelector, 'dolphins');
    await tests.helpers.elementClick(routesFilterSelector);
    await tests.app.client.keys(['Escape']);
    await tests.helpers.assertElementValue(routesFilterSelector, '');
  });

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
    tests.helpers.mockDialog('showSaveDialog', [
      resolve('./tmp/storage/dup-env1-test.json')
    ]);
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
    tests.helpers.mockDialog('showSaveDialog', [
      resolve('./tmp/storage/new-env1-test.json')
    ]);
    await tests.helpers.addEnvironment();
    await tests.helpers.assertElementValue(routesFilterSelector, '');
  });

  it('Reset routes filter when removing environment', async () => {
    await tests.helpers.setElementValue(routesFilterSelector, '/dolphins');
    await tests.helpers.closeEnvironment(3);
    await tests.helpers.assertElementValue(routesFilterSelector, '');
  });
});
