import { Tests } from 'test/lib/tests';

export async function addEnvironment(testsInstance: Tests) {
  await testsInstance.spectron.client.element('.menu-columns:first-of-type .nav:first-of-type .nav-item .nav-link').click();
}

export async function countEnvironments(expected: number, testsInstance: Tests) {
  await testsInstance.spectron.client.elements('.menu-columns:first-of-type .menu-list .nav-item').should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
}
