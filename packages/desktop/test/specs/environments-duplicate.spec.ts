import { resolve } from 'path';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import environmentsSettings from '../libs/environments-settings';
import http from '../libs/http';
import navigation from '../libs/navigation';
import routes from '../libs/routes';

describe('Duplicate environments', () => {
  describe('Duplicate an environment', () => {
    it('should open the environment with routes', async () => {
      await environments.open('basic-data');
    });

    it('should duplicate first environment', async () => {
      await dialogs.save(resolve('./tmp/storage/dup-env-test.json'));
      await environments.duplicate(1);
      await environments.assertCount(2);
    });

    it('should verify duplicated environment selected', async () => {
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.assertSettingValue('port', '3001');
    });
  });

  describe('Duplicate an environment with no route', () => {
    it('should remove all routes', async () => {
      await navigation.switchView('ENV_ROUTES');
      await environments.close(2);
      await routes.remove(1);
      await routes.remove(1);
      await routes.remove(1);
      await routes.assertCount(0);
    });

    it('should duplicate the environment', async () => {
      await dialogs.save(resolve('./tmp/storage/dup-env2-test.json'));
      await environments.duplicate(1);
      await environments.assertCount(2);
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.assertSettingValue('port', '3001');
      await environmentsSettings.assertSettingValue(
        'name',
        'Basic data (copy)'
      );
    });

    it('should be able to start the duplicated environment', async () => {
      await environments.start();

      await http.assertCallWithPort(
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
});
