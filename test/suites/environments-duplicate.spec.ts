import { resolve } from 'path';
import { Tests } from 'test/lib/tests';

describe('Duplicate an environment', () => {
  const tests = new Tests('basic-data');

  it('Add an environment', async () => {
    await tests.helpers.countEnvironments(1);
    tests.helpers.mockDialog('showSaveDialog', [
      resolve('./tmp/storage/new-env-test.json')
    ]);
    await tests.helpers.addEnvironment();
    await tests.helpers.countEnvironments(2);
  });

  it('Duplicate first environment', async () => {
    tests.helpers.mockDialog('showSaveDialog', [
      resolve('./tmp/storage/dup-env-test.json')
    ]);
    await tests.helpers.duplicateEnvironment(1);
    await tests.helpers.countEnvironments(3);
  });

  it('Select second environment', async () => {
    await tests.helpers.elementClick(
      '.environments-menu .menu-list .nav-item:nth-of-type(2)'
    );
  });

  it('Verify duplicated environment selected', async () => {
    await tests.helpers.switchView('ENV_SETTINGS');
    await tests.helpers.assertActiveEnvironmentPort(3002);
  });
});

describe('Duplicate an environment with no route', () => {
  const tests = new Tests('basic-data');

  it('should remove all routes', async () => {
    await tests.helpers.removeRoute(1);
    await tests.helpers.removeRoute(1);
    await tests.helpers.removeRoute(1);
    await tests.helpers.countRoutes(0);
  });

  it('should duplicate the environment', async () => {
    tests.helpers.mockDialog('showSaveDialog', [
      resolve('./tmp/storage/dup-env2-test.json')
    ]);
    await tests.helpers.duplicateEnvironment(1);
    await tests.helpers.countEnvironments(2);
    await tests.helpers.switchView('ENV_SETTINGS');
    await tests.helpers.assertActiveEnvironmentPort(3001);
    await tests.helpers.assertActiveEnvironmentName('FT env (copy)');
  });

  it('should be able to start the duplicated environment', async () => {
    await tests.helpers.startEnvironment();

    await tests.helpers.httpCallAsserterWithPort(
      {
        description: 'Call server root',
        path: '/',
        method: 'GET',
        testedResponse: {
          status: 404,
          body: /Cannot GET \//
        }
      },
      3001
    );
  });
});
