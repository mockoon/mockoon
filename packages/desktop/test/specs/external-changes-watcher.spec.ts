import { randomUUID } from 'crypto';
import { resolve } from 'path';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import file from '../libs/file';
import http from '../libs/http';
import modals from '../libs/modals';
import navigation from '../libs/navigation';
import settings from '../libs/settings';
import utils from '../libs/utils';

describe('Environment external reload', () => {
  const newUUID = randomUUID();

  it('should enable automated file watching and assert that file watching is disabled by default', async () => {
    // wait a bit for app to load, apparently cannot open the modal too soon
    await browser.pause(1000);
    await settings.open();
    await settings.assertDropdownSettingValue('fileWatcherEnabled', 'Disabled');
    await settings.setDropdownSettingValue('settings-storage-file-watcher', 3);
    await modals.close();
  });

  it('should open and start an environment', async () => {
    await environments.open('ui-1');
    await environments.start();
  });

  it('should assert the environment is running', async () => {
    await http.assertCallWithPort(
      {
        protocol: 'https',
        method: 'GET',
        path: '/answer',
        testedResponse: {
          body: '42',
          status: 200
        }
      },
      3000
    );
    await navigation.assertHeaderValue('ENV_LOGS', 'Logs 1');
  });

  it('should edit the environment externally and assert values changed', async () => {
    await utils.waitForAutosave();
    await utils.waitForFileWatcher();
    await file.editEnvironment('./tmp/storage/ui-1.json', {
      name: 'env 1 (change1)',
      port: 5005,
      uuid: newUUID
    });
    await environments.assertMenuEntryText(
      1,
      'env 1 (change1)',
      '0.0.0.0:5005'
    );

    await navigation.assertHeaderValue('ENV_LOGS', 'Logs');
  });

  it('should assert the settings were updated after a UUID change', async () => {
    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      ['environments.0.uuid'],
      [newUUID]
    );
  });

  it('should assert environment is still running after the changes', async () => {
    await http.assertCallWithPort(
      {
        protocol: 'https',
        method: 'GET',
        path: '/answer',
        testedResponse: {
          body: '42',
          status: 200
        }
      },
      5005
    );
    await navigation.assertHeaderValue('ENV_LOGS', 'Logs 1');
    await navigation.switchView('ENV_LOGS');
    await environmentsLogs.assertCount(1);
  });

  it('should open a second environment', async () => {
    await environments.open('ui-2');
  });

  it('should modify the two environments and assert that second environment is still the active one and modified environment is still in the first position', async () => {
    await utils.waitForAutosave();
    await utils.waitForFileWatcher();
    await file.editEnvironment('./tmp/storage/ui-1.json', {
      name: 'env 1 (change2)',
      port: 5005,
      uuid: randomUUID()
    });
    await file.editEnvironment('./tmp/storage/ui-2.json', {
      name: 'env 2 (change1)',
      uuid: randomUUID()
    });

    await browser.pause(2000);
    await environments.assertActiveMenuEntryText('env 2 (change1)');
    await environments.assertMenuEntryText(1, 'env 1 (change2)');
  });

  it('should assert the external watch works after a duplicate', async () => {
    await dialogs.save(resolve('./tmp/storage/new-dup-env.json'));
    await environments.duplicate(1);
    await browser.pause(100);
    await environments.assertActiveMenuEntryText('env 1 (change2) (copy)');
    await utils.waitForAutosave();
    await utils.waitForFileWatcher();
    await file.editEnvironment('./tmp/storage/new-dup-env.json', {
      name: 'env 3 (change1)'
    });

    await environments.assertActiveMenuEntryText('env 3 (change1)');
    await environments.close(2);
  });

  it('should switch to prompt mode', async () => {
    await settings.open();
    await settings.assertDropdownSettingValue('fileWatcherEnabled', 'Auto');
    await settings.setDropdownSettingValue('settings-storage-file-watcher', 2);
    await modals.close();
    await browser.pause(500);
  });

  it('should modify the two environments and assert that a prompt is displayed and ignore the changes', async () => {
    await file.editEnvironment('./tmp/storage/ui-1.json', {
      name: 'env 1 (change3)'
    });
    await file.editEnvironment('./tmp/storage/ui-2.json', {
      name: 'env 2 (change2)'
    });
    await modals.assertTitle('External changes detected');
    // check the confirm modal list
    expect(await (await $('.modal-body ul li:nth-child(1)')).getText()).toEqual(
      'env 1 (change2)'
    );
    expect(await (await $('.modal-body ul li:nth-child(2)')).getText()).toEqual(
      'env 2 (change1)'
    );
    await modals.cancel();
    await browser.pause(500);

    await environments.assertActiveMenuEntryText('env 1 (change2)');
    await environments.assertMenuEntryText(2, 'env 2 (change1)');
  });

  it('should modify the two environments and assert that a prompt is displayed and validate the changes', async () => {
    await file.editEnvironment('./tmp/storage/ui-1.json', {
      name: 'env 1 (change3)'
    });
    await file.editEnvironment('./tmp/storage/ui-2.json', {
      name: 'env 2 (change2)'
    });
    await modals.assertTitle('External changes detected');
    // check the confirm modal list
    expect(await (await $('.modal-body ul li:nth-child(1)')).getText()).toEqual(
      'env 1 (change2)'
    );
    expect(await (await $('.modal-body ul li:nth-child(2)')).getText()).toEqual(
      'env 2 (change1)'
    );
    await modals.confirm();
    await browser.pause(2000);

    await environments.assertActiveMenuEntryText('env 1 (change3)');
    await environments.assertMenuEntryText(2, 'env 2 (change2)');
  });
});
