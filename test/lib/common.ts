import { HttpCall } from 'test/lib/types';
import { fetch } from './fetch';
import { Tests } from './tests';

export async function addEnvironment(testsInstance: Tests) {
  await testsInstance.spectron.client.element('.menu-column--environments .nav:first-of-type .nav-item .nav-link').click();
}

export async function addRoute(testsInstance: Tests) {
  await testsInstance.spectron.client.element('.menu-column--routes .nav:first-of-type .nav-item .nav-link').click();
}

export async function countEnvironments(expected: number, testsInstance: Tests) {
  await testsInstance.spectron.client.elements('.menu-column--environments .menu-list .nav-item').should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
}

export async function countRoutes(expected: number, testsInstance: Tests) {
  await testsInstance.spectron.client.elements('.menu-column--routes .menu-list .nav-item').should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
}

export async function contextMenuClickAndConfirm(targetMenuItemSelector: string, contextMenuItemIndex: number, testsInstance: Tests) {
  await testsInstance.spectron.client.element(targetMenuItemSelector).rightClick();

  // click twice to confirm (cannot double click)
  await testsInstance.spectron.client.element(`.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`).click();
  await testsInstance.spectron.client.element(`.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`).click();
}

export async function startEnvironment(testsInstance: Tests) {
  await testsInstance.spectron.client.element('.btn i[ngbtooltip="Start server"]').click();
  await testsInstance.spectron.client.waitForExist(`.menu-column--environments .menu-list .nav-item .nav-link.running`);
}

export async function switchTab(tabName: 'LOGS' | 'SETTINGS', testsInstance: Tests) {
  const selectors = {
    LOGS: 'Environment logs',
    SETTINGS: 'Environment settings'
  };

  await testsInstance.spectron.client.element(`.header .btn[ngbTooltip="${selectors[tabName]}"]`).click();
}


export async function httpCallAsserter(httpCall: HttpCall, testsInstance: Tests) {
  await fetch({
    protocol: 'http',
    port: 3000,
    path: httpCall.path,
    method: httpCall.method
  }).should.eventually.deep.include(
    Object.keys(httpCall.testedProperties).reduce((propertiesToTest, propertyName) => {
      return { ...propertiesToTest, [propertyName]: httpCall.testedProperties[propertyName] };
    }, {})
  );
}
