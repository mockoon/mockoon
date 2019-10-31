import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Create and delete environments', () => {
  tests.runHooks();

  it('Add an environment', async () => {
    await tests.helpers.countEnvironments(1);
    await tests.helpers.addEnvironment();
    await tests.helpers.countEnvironments(2);
    await tests.helpers.assertActiveEnvironmentPort(3001);
  });

  it('Remove first environment', async () => {
    await tests.helpers.contextMenuClickAndConfirm('.menu-column--environments .menu-list .nav-item:first-of-type', 5);

    await tests.helpers.countEnvironments(1);
  });

  it('Added environment should remain and be active', async () => {
    await tests.spectron.client.getText('.menu-column--environments .menu-list .nav-item:first-of-type .nav-link.active div:first-of-type').should.eventually.equal('New environment');
  });

  it('Remove last environment, interface should be empty', async () => {
    await tests.helpers.contextMenuClickAndConfirm('.menu-column--environments .menu-list .nav-item:first-of-type', 5);

    await tests.helpers.countEnvironments(0);
    await tests.helpers.countRoutes(0);

    await tests.spectron.client.waitForExist('.header input[placeholder="No environment"]');
  });

  it('Add ten environments ever clicking in the first', async() => {
    let port = 3000;
    for (let i = 0; i < 10; i++) {
      await tests.helpers.addEnvironment();
      await tests.helpers.assertActiveEnvironmentPort(port);
      await tests.helpers.selectEnvironment(1);
      port++;
    }
  });
});
