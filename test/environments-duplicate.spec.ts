import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Duplicate an environment', () => {
  tests.runHooks();

  it('Open environment menu', async () => {
    await tests.helpers.toggleEnvironmentMenu();
  });

  it('Add an environment', async () => {
    await tests.helpers.countEnvironments(1);
    await tests.helpers.addEnvironment();
    await tests.helpers.countEnvironments(2);
  });

  it('Duplicate first environment', async () => {
    await tests.helpers.contextMenuClick('.environments-menu .menu-list .nav-item:nth-of-type(1)', 3)

    await tests.helpers.countEnvironments(3);
  });

  it('Select second environment', async () => {
    await tests.app.client.element('.environments-menu .menu-list .nav-item:nth-of-type(2)').click();
  });

  it('Verify duplicated environment selected', async () => {
    await tests.helpers.assertActiveEnvironmentPort(3002);
  });
});
