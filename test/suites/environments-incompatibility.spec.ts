import { resolve } from 'path';
import { Tests } from 'test/lib/tests';

describe('Environments incompatibility', () => {
  const tests = new Tests('migrations/incompatible');

  it('should have only one active environment "FT env 2", incompatible environment should be ignored when app load', async () => {
    await tests.helpers.countEnvironments(1);
    await tests.helpers.switchView('ENV_SETTINGS');
    await tests.helpers.assertActiveEnvironmentName('FT env 2');

    await tests.helpers.waitForAutosave();

    await tests.helpers.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      ['environments.0.uuid', 'environments.1'],
      ['45975cc8-256c-43d3-af86-b4239618f83c', undefined]
    );
  });

  it('should be unable to import an incompatible environment', async () => {
    tests.helpers.mockDialog('showOpenDialog', [
      './test/data/migrations/incompatible/exported.json'
    ]);
    tests.helpers.mockDialog('showSaveDialog', [
      resolve('./tmp/storage/imported.json')
    ]);
    tests.helpers.selectMenuEntry('IMPORT_FILE');

    await tests.app.client.pause(500);

    await tests.helpers.checkToastDisplayed(
      'warning',
      'Environment "FT env" was created with a more recent version of Mockoon. Please upgrade.'
    );
  });
});
