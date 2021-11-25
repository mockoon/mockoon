import { expect } from 'chai';
import { resolve } from 'path';
import { Tests } from 'test/lib/tests';

describe('Create, close and open environments', () => {
  const tests = new Tests('basic-data');

  it('Add an environment', async () => {
    await tests.helpers.countEnvironments(1);
    tests.helpers.mockDialog('showSaveDialog', [
      resolve('./tmp/storage/custom-folder/new-env-test.json')
    ]);
    await tests.helpers.addEnvironment();
    await tests.helpers.waitForAutosave();

    await tests.helpers.countEnvironments(2);
    await tests.helpers.switchView('ENV_SETTINGS');
    await tests.helpers.assertActiveEnvironmentPort(3001);
    await tests.helpers.assertActiveEnvironmentName('New env test');
  });

  it('Close first environment', async () => {
    await tests.helpers.closeEnvironment(1);
    await tests.helpers.countEnvironments(1);
  });

  it('Added environment should remain and be active', async () => {
    const envName = await tests.helpers.getElementText(
      '.environments-menu .menu-list .nav-item:first-of-type .nav-link.active div:first-of-type'
    );
    expect(envName).to.contains('New env test');
  });

  it('Close last environment, interface should be empty', async () => {
    await tests.helpers.closeEnvironment(1);

    await tests.helpers.countEnvironments(0);
    await tests.helpers.countRoutes(0);

    await tests.helpers.assertElementText('.message', 'No environment opened');
  });

  it('open environment', async () => {
    tests.helpers.mockDialog('showOpenDialog', [
      resolve('./tmp/storage/custom-folder/new-env-test.json')
    ]);
    await tests.helpers.openEnvironment();
    await tests.app.client.pause(500);
    await tests.helpers.countEnvironments(1);
    await tests.helpers.switchView('ENV_SETTINGS');
    await tests.helpers.assertHasActiveEnvironment('New env test');
    await tests.helpers.closeEnvironment(1);
  });

  it('Add 5 environments, assert that port number is increased automatically', async () => {
    for (let port = 3000; port < 3005; port++) {
      tests.helpers.mockDialog('showSaveDialog', [
        resolve(`./tmp/storage/new-env-test-${port}.json`)
      ]);
      await tests.helpers.addEnvironment();
      await tests.helpers.switchView('ENV_SETTINGS');
      await tests.helpers.assertActiveEnvironmentPort(port);
    }
  });
});
