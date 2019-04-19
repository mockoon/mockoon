import { addEnvironment, countEnvironments } from './lib/common';
import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Create and delete environments', () => {
  tests.runHooks();

  tests.waitForWindowReady();
  tests.waitForEnvironmentLoaded();

  it('Add an environment', async () => {
    await countEnvironments(1, tests);
    await addEnvironment(tests);
    await countEnvironments(2, tests);
  });

  it('Remove first environment', async () => {
    const contextMenuDeleteSelector = '.context-menu .context-menu-item:nth-child(5)';

    await countEnvironments(2, tests);
    await tests.spectron.client.element('.menu-columns:first-of-type .menu-list .nav-item:first-of-type').rightClick();

    // click twice to confirm (cannot double click)
    await tests.spectron.client.element(contextMenuDeleteSelector).click();
    await tests.spectron.client.element(contextMenuDeleteSelector).click();

    await countEnvironments(1, tests);
  });

  it('Added environment should remain and be active', async () => {
    await tests.spectron.client.getText('.menu-columns:first-of-type .menu-list .nav-item:first-of-type .nav-link.active div:first-of-type').should.eventually.equal('New environment');
  });
});
