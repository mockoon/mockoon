import { addEnvironment, contextMenuClickAndConfirm, countEnvironments, countRoutes } from './lib/common';
import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Create and delete environments', () => {
  tests.runHooks();

  it('Add an environment', async () => {
    await countEnvironments(1, tests);
    await addEnvironment(tests);
    await countEnvironments(2, tests);
  });

  it('Remove first environment', async () => {
    await contextMenuClickAndConfirm('.menu-column--environments .menu-list .nav-item:first-of-type', 5, tests);

    await countEnvironments(1, tests);
  });

  it('Added environment should remain and be active', async () => {
    await tests.spectron.client.getText('.menu-column--environments .menu-list .nav-item:first-of-type .nav-link.active div:first-of-type').should.eventually.equal('New environment');
  });

  it('Remove last environment, interface should be empty', async () => {
    await contextMenuClickAndConfirm('.menu-column--environments .menu-list .nav-item:first-of-type', 5, tests);

    await countEnvironments(0, tests);
    await countRoutes(0, tests);

    await tests.spectron.client.waitForExist('.header input[placeholder="No environment"]');
  });
});
