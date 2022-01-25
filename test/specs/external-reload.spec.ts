import { resolve } from 'path';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import file from '../libs/file';
import http from '../libs/http';
import utils from '../libs/utils';

describe('Environment external reload', () => {
  it('should open multiple environments and start the first one', async () => {
    await environments.open('ui-1');
    await environments.start();
    await environments.open('ui-2');
  });

  it('should call the first running env on port 3000', async () => {
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
  });

  it('should edit first environment externally and assert a toast was displayed', async () => {
    await file.editEnvironment('./tmp/storage/ui-1.json', {
      name: 'env 1 new name',
      port: 5005
    });
    await browser.pause(500);

    await utils.checkToastDisplayed(
      'success',
      'Environment "UI env" was modified externally and reloaded.'
    );
  });

  it('should assert that second environment is still the active one and modified environment is reopened at first position', async () => {
    await environments.assertActiveMenuEntryText('UI env name edit');
    await environments.assertMenuEntryText(1, 'env 1 new name');
  });

  it('should assert the order in settings descriptors was kept', async () => {
    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      ['environments.0.uuid', 'environments.1.uuid'],
      [
        '323a25c6-b196-4d27-baf8-8aeb83d87c76',
        '9ca3284a-d5e8-42a4-b3dc-cd74a304c764'
      ]
    );
  });

  it('should assert that the env is still running and a call can be made to the new port', async () => {
    await http.assertCallWithPort(
      {
        protocol: 'https',
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '42'
        }
      },
      5005
    );
  });

  it('should reload the app', async () => {
    await browser.reloadSession();
  });

  it('should assert the external watch works after a normal load', async () => {
    await browser.pause(2000);
    await file.editEnvironment('./tmp/storage/ui-1.json', {
      name: 'env 1 renamed'
    });

    await browser.pause(500);
    await utils.checkToastDisplayed(
      'success',
      'Environment "env 1 new name" was modified externally and reloaded.'
    );
    await environments.assertActiveMenuEntryText('env 1 renamed');
  });

  it('should assert the external watch works after a duplicate', async () => {
    await dialogs.save(resolve('./tmp/storage/new-dup-env.json'));
    await environments.duplicate(1);
    await environments.assertActiveMenuEntryText('env 1 renamed (copy)');
    await utils.waitForAutosave();
    await file.editEnvironment('./tmp/storage/new-dup-env.json', {
      name: 'renamed name copy'
    });

    await browser.pause(500);
    await utils.checkToastDisplayed(
      'success',
      'Environment "env 1 renamed (copy)" was modified externally and reloaded.'
    );
    await environments.assertActiveMenuEntryText('renamed name copy');
  });
});
