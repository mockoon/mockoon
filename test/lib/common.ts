import { Tests } from 'test/lib/tests';

export async function addEnvironment(testsInstance: Tests) {
  await testsInstance.spectron.client.element('.menu-columns:nth-child(1) .nav:first-of-type .nav-item .nav-link').click();
}

export async function addRoute(testsInstance: Tests) {
  await testsInstance.spectron.client.element('.menu-columns:nth-child(2) .nav:first-of-type .nav-item .nav-link').click();
}

export async function countEnvironments(expected: number, testsInstance: Tests) {
  await testsInstance.spectron.client.elements('.menu-columns:nth-child(1) .menu-list .nav-item').should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
}

export async function countRoutes(expected: number, testsInstance: Tests) {
  await testsInstance.spectron.client.elements('.menu-columns:nth-child(2) .menu-list .nav-item').should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
}

export async function contextMenuClickAndConfirm(targetMenuItemSelector: string, contextMenuItemIndex: number, testsInstance: Tests) {
  await testsInstance.spectron.client.element(targetMenuItemSelector).rightClick();

  // click twice to confirm (cannot double click)
  await testsInstance.spectron.client.element(`.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`).click();
  await testsInstance.spectron.client.element(`.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`).click();
}
