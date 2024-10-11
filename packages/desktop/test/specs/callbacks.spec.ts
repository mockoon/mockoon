import { resolve } from 'path';
import callbacks from '../libs/callbacks';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import environmentsSettings from '../libs/environments-settings';
import file from '../libs/file';
import headersUtils from '../libs/headers-utils';
import http from '../libs/http';
import modals from '../libs/modals';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import settings from '../libs/settings';
import utils, { DropdownMenuCallbackActions } from '../libs/utils';

const env1FilePath = './tmp/storage/callbacks.json';

describe('Callbacks navigation and deletion', () => {
  it('should open the environment', async () => {
    await environments.open('callbacks');
    await settings.open();
    await settings.setSettingValue('settings-faker-seed', '1');
    await modals.close();
  });

  it('should navigate to the callbacks tab and verify the header count', async () => {
    await navigation.switchView('ENV_CALLBACKS');
    await callbacks.assertCount(3);
    await navigation.assertHeaderValue('ENV_CALLBACKS', 'Callbacks 3');
  });

  it('should delete the last callback and verify the header count and message', async () => {
    await callbacks.remove(3);
    await callbacks.assertCount(2);
    await navigation.assertHeaderValue('ENV_CALLBACKS', 'Callbacks 2');
  });
});

describe('Callback addition', () => {
  it('should add a callback', async () => {
    await callbacks.add();
    await callbacks.assertCount(3);
    await callbacks.assertName('Callback');
  });

  it('should be able to add headers for the new callbacks', async () => {
    await callbacks.headersTabInDefinition.click();
    await headersUtils.add('response-callback-headers', {
      key: 'X-Test-Header',
      value: 'Test Value 123'
    });
    await headersUtils.assertCount('response-callback-headers', 1);

    await headersUtils.add('response-callback-headers', {
      key: 'X-Test-Header-2',
      value: 'Test Value 456'
    });
    await headersUtils.assertCount('response-callback-headers', 2);
    await utils.waitForAutosave();

    const addedHeaders = await file.getObjectPropertyInFile(
      env1FilePath,
      'callbacks.2.headers'
    );
    expect(addedHeaders).toHaveLength(2);
    expect(addedHeaders[0].key).toEqual('X-Test-Header');
    expect(addedHeaders[0].value).toEqual('Test Value 123');
    expect(addedHeaders[1].key).toEqual('X-Test-Header-2');
    expect(addedHeaders[1].value).toEqual('Test Value 456');

    await callbacks.bodyTabInDefinition.click();
  });

  it('should clear body for unsupporting http methods', async () => {
    await callbacks.assertCount(3);
    await callbacks.select(3);

    // get
    await callbacks.setMethod(1);
    await callbacks.assertCallbackBodySpecExists(false);
    await callbacks.assertNoBodySupportingLabelExists(true);

    // post
    await callbacks.setMethod(2);
    await callbacks.assertCallbackBodySpecExists(true);
    await callbacks.assertNoBodySupportingLabelExists(false);

    // put
    await callbacks.setMethod(3);
    await callbacks.assertCallbackBodySpecExists(true);
    await callbacks.assertNoBodySupportingLabelExists(false);

    // patch
    await callbacks.setMethod(4);
    await callbacks.assertCallbackBodySpecExists(true);
    await callbacks.assertNoBodySupportingLabelExists(false);

    // delete
    await callbacks.setMethod(5);
    await callbacks.assertCallbackBodySpecExists(false);
    await callbacks.assertNoBodySupportingLabelExists(true);

    // head
    await callbacks.setMethod(6);
    await callbacks.assertCallbackBodySpecExists(false);
    await callbacks.assertNoBodySupportingLabelExists(true);

    // options
    await callbacks.setMethod(7);
    await callbacks.assertCallbackBodySpecExists(false);
    await callbacks.assertNoBodySupportingLabelExists(true);
  });
});

describe('Callback edition', () => {
  it('should edit a callback name', async () => {
    await callbacks.setName('Testing callback');

    await utils.waitForAutosave();

    await callbacks.assertName('Testing callback');
    await file.verifyObjectPropertyInFile(
      env1FilePath,
      ['callbacks.2.name'],
      ['Testing callback']
    );
  });

  it('should edit a callback documentation', async () => {
    await callbacks.setDocumentation('Documentation of the callback');

    await utils.waitForAutosave();

    await callbacks.assertDocumentation('Documentation of the callback');
    await file.verifyObjectPropertyInFile(
      env1FilePath,
      ['callbacks.2.documentation'],
      ['Documentation of the callback']
    );
  });
});

describe('Callback duplication', () => {
  it('should duplicate a callback', async () => {
    await callbacks.duplicate(2);
    await callbacks.assertCount(4);
    await callbacks.assertName('Callback PUT (copy)');

    await utils.waitForAutosave();
    const clonedValues = await file.getObjectPropertiesInFile(env1FilePath, [
      'callbacks.1.documentation',
      'callbacks.1.method',
      'callbacks.1.uri',
      'callbacks.1.method',
      'callbacks.1.body',
      'callbacks.1.bodyType',
      'callbacks.1.sendFileAsBody',
      'callbacks.1.databucketID',
      'callbacks.1.filePath'
    ]);
    await file.verifyObjectPropertyInFile(
      env1FilePath,
      [
        'callbacks.2.documentation',
        'callbacks.2.method',
        'callbacks.2.uri',
        'callbacks.2.method',
        'callbacks.2.body',
        'callbacks.2.bodyType',
        'callbacks.2.sendFileAsBody',
        'callbacks.2.databucketID',
        'callbacks.2.filePath'
      ],
      clonedValues
    );
  });
});

describe('Callback duplication to another envionment', () => {
  it('assert the context menu entry is disabled when there is only one env', async () => {
    await utils.dropdownMenuAssertDisabled(
      '.callbacks-menu .nav-item:nth-child(1) .nav-link',
      DropdownMenuCallbackActions.DUPLICATE_TO_ENV
    );
  });

  it("should open duplication modal and verify selected callbacks's information on modal", async () => {
    await environments.open('basic-data.json');
    await environments.select(1);
    await navigation.switchView('ENV_CALLBACKS');
    await callbacks.duplicateToEnv(2);

    await modals.assertExists();

    const modalText = await $('.modal-content .modal-title small').getText();

    expect(modalText).toContain('Callback PUT');

    await modals.assertDuplicationModalEnvName('Basic data');
    await modals.assertDuplicationModalEnvHostname('localhost:3000/');
  });

  it('should duplicate the callback in another env', async () => {
    await modals.confirmDuplicateToEnvModal(1);
    await callbacks.assertName('Callback PUT');
    await callbacks.assertCount(1);
  });
});

describe('Callback filter', () => {
  it('should get focused when pressing ctrl + shift + f', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_CALLBACKS');
    await browser.keys([
      process.platform === 'darwin' ? 'Command' : 'Control',
      'Shift',
      'f'
    ]);
    expect(await callbacks.filter.isFocused()).toEqual(true);
  });

  it('should get cleared when pressing escape while focused', async () => {
    await callbacks.setFilter('data');
    await callbacks.filter.click();
    await browser.keys(['Escape']);
    await callbacks.assertFilter('');
  });

  it('should filter callbacks by documentation', async () => {
    await callbacks.select(1);
    await callbacks.setDocumentation('This is use to test a Post callback');
    await callbacks.select(2);
    await callbacks.setName('Still a nice callback');

    await callbacks.assertCount(4);

    await callbacks.setFilter('Post');
    await browser.pause(100);
    await callbacks.assertCount(1);
    await callbacks.clearFilter();
  });

  it('should filter callbacks by name', async () => {
    await callbacks.select(1);
    await callbacks.setName('First callback');
    await callbacks.select(2);
    await callbacks.setName('Second callbacks');

    await callbacks.assertCount(4);

    await callbacks.setFilter('Second');
    await browser.pause(100);
    await callbacks.assertCount(1);
  });

  it('should reset callback filter when clicking on the button Clear filter', async () => {
    await callbacks.clearFilter();
    await browser.pause(200);
    await callbacks.assertCount(4);
  });

  it('should reset callbacks filter when adding a new callback', async () => {
    await callbacks.setFilter('Second');
    await callbacks.add();
    await callbacks.assertFilter('');
    await callbacks.remove(5);
  });

  it('should reset callbacks filter when switching env', async () => {
    await callbacks.setFilter('Second');
    await dialogs.save(resolve('./tmp/storage/dup-callbacks.json'));
    await environments.duplicate(1);
    await navigation.switchView('ENV_CALLBACKS');
    await callbacks.assertFilter('');
  });

  it('should reset callbacks filter when duplicating callback to selected environment', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_CALLBACKS');
    await callbacks.setFilter('Second');
    await browser.pause(100);
    await callbacks.assertCount(1);

    await utils.dropdownMenuClick(
      `.callbacks-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuCallbackActions.DUPLICATE_TO_ENV
    );
    await $(
      '.modal-content .modal-body .list-group .list-group-item:first-child'
    ).click();

    await navigation.switchView('ENV_CALLBACKS');
    await callbacks.assertFilter('');
  });

  it('should reset callbacks filter when adding a new environment', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_CALLBACKS');

    await callbacks.setFilter('Second');
    await environments.add('dup2-callbacks');
    await navigation.switchView('ENV_CALLBACKS');

    await callbacks.assertFilter('');
  });

  it('should reset callbacks filter when removing environment', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_CALLBACKS');

    await callbacks.setFilter('Second');
    await browser.pause(100);
    await environments.close(2);
    await callbacks.assertFilter('');
  });
});

describe('Callback selection under a response', () => {
  it('should be able to select defined callbacks under a response', async () => {
    await navigation.switchView('ENV_ROUTES');
    await routes.addHTTPRoute();
    await routes.setPath('test/callbacks');
    await routes.callbacksTab.click();
    await callbacks.assertNumberofAttachedCallbacks(0);
    await callbacks.attachCallback();
    // by default, go to definition should be visible with first item selected
    await callbacks.assertGotoDefinitionExists(0, true);

    await callbacks.assertNumberofAttachedCallbacks(1);
    await callbacks.assertRouteCallbackHasEntries(0, 4);
    await utils.selectDropdownItem('callback0target', 1);
    await callbacks.assertGotoDefinitionExists(0, true);
  });

  it('should be able to navigate to definition of the callback', async () => {
    await callbacks.getGoToDefinitionBtn(1).click();
    await navigation.assertActiveTab('ENV_CALLBACKS');
    await callbacks.assertDefinitionTabActive();
  });

  it('should have updated the number of usages of the callback', async () => {
    await callbacks.assertUsageCount(1);
    await callbacks.usageTab.click();
    await callbacks.assertHasUsageItems(1);
  });

  it('should be able to attach multiple callbacks', async () => {
    await navigation.switchView('ENV_ROUTES');
    await routes.select(4);
    await routes.callbacksTab.click();
    await callbacks.assertNumberofAttachedCallbacks(1);

    // add one more callbacks
    await callbacks.attachCallback();
    await callbacks.assertNumberofAttachedCallbacks(2);
    await callbacks.assertRouteCallbackHasEntries(1, 4);
    await utils.selectDropdownItem('callback1target', 2);
  });

  it('should be able to delete attached callback', async () => {
    // delete before attach
    await callbacks.attachCallback();
    await callbacks.deleteAttachedCallback(2);
    await callbacks.assertNumberofAttachedCallbacks(2);

    // delete attached callback
    await callbacks.deleteAttachedCallback(1);
    await callbacks.assertNumberofAttachedCallbacks(1);
  });
});

describe('Callback usages', () => {
  it('should have no usages for new callbacks', async () => {
    await navigation.switchView('ENV_CALLBACKS');
    await callbacks.definitionTab.click();
    await callbacks.add();
    await utils.waitForAutosave();
    await callbacks.assertCount(5);
    await callbacks.setName('Usage Test 01');
    await callbacks.setUri('https://test.io/callback1');
    await callbacks.setMethod(2);
    await callbacks.assertUsageCount(0);
    await callbacks.usageTab.click();
    await callbacks.assertNoUsageLabelExists();
    await callbacks.definitionTab.click();

    await callbacks.add();
    await utils.waitForAutosave();
    await callbacks.assertCount(6);
    await callbacks.setName('Usage Test 02');
    await callbacks.setUri('https://test.io/callback2');
    await callbacks.assertUsageCount(0);
  });

  it('should be updated usages when attached to a router', async () => {
    await navigation.switchView('ENV_ROUTES');
    await routes.addHTTPRoute();
    await routes.setPath('test/usages/1');

    await routes.callbacksTab.click();
    await callbacks.attachCallback();
    await callbacks.assertRouteCallbackHasEntries(0, 6);
    await utils.selectDropdownItem('callback0target', 5);

    await callbacks.getGoToDefinitionBtn(1).click();
    await callbacks.assertDefinitionTabActive();
    await callbacks.assertActiveCallbackEntryText('Usage Test 01');
    await callbacks.assertUsageCount(1);
    await callbacks.usageTab.click();
    await callbacks.assertHasUsageItems(1);
  });

  it('should navigate to callback tab when clicked on a response label', async () => {
    await navigation.switchView('ENV_CALLBACKS');
    await callbacks.select(5);
    await callbacks.assertUsageCount(1);
    await callbacks.usageTab.click();
    await callbacks.getUsageItem(1, 1).click();
    await navigation.assertActiveTab('ENV_ROUTES');
    await routes.assertActiveMenuEntryText('test/usages/1');
    expect(await callbacks.attachCallbackBtn.isExisting()).toEqual(true);
  });

  it('should display correct usage count for each callback', async () => {
    await callbacks.attachCallback();
    await callbacks.assertRouteCallbackHasEntries(1, 6);
    await utils.selectDropdownItem('callback1target', 6);

    await utils.waitForAutosave();
    await callbacks.getGoToDefinitionBtn(2).click();
    await callbacks.assertDefinitionTabActive();
    await callbacks.assertActiveCallbackEntryText('Usage Test 02');
    await callbacks.assertUsageCount(1);
    await callbacks.usageTab.click();
    await callbacks.assertHasUsageItems(1);
  });

  it('should display multiple usages in sorted routed order', async () => {
    await navigation.switchView('ENV_ROUTES');
    await routes.addHTTPRoute();
    await routes.assertCount(6);
    await routes.setPath('test/usages/2');
    await utils.openDropdown('methods');
    await utils.selectDropdownItem('methods', 3);
    await routes.callbacksTab.click();
    await callbacks.attachCallback();
    await callbacks.assertRouteCallbackHasEntries(0, 6);
    await utils.selectDropdownItem('callback0target', 6);

    await utils.waitForAutosave();
    await callbacks.getGoToDefinitionBtn(1).click();
    await callbacks.assertActiveCallbackEntryText('Usage Test 02');
    await callbacks.assertUsageCount(2);
    await callbacks.usageTab.click();
    await callbacks.assertHasUsageItems(2);
    await callbacks.assertUsageRouteText(1, 'GET /test/usages/1');
    await callbacks.assertUsageRouteResponseText(1, 1, 'Response 200');
    await callbacks.assertUsageRouteText(2, 'POST /test/usages/2');
    await callbacks.assertUsageRouteResponseText(2, 1, 'Response 200');
  });

  it('should display multiple usages in different route responses properly', async () => {
    await navigation.switchView('ENV_ROUTES');
    await routes.select(6);
    await routes.addRouteResponse();
    await utils.openDropdown('status-code');
    await utils.selectDropdownItem('status-code', 1);
    await routes.callbacksTab.click();
    await callbacks.attachCallback();
    await callbacks.assertRouteCallbackHasEntries(0, 6);
    await utils.selectDropdownItem('callback0target', 6);

    await utils.waitForAutosave();
    await callbacks.getGoToDefinitionBtn(1).click();
    await callbacks.assertActiveCallbackEntryText('Usage Test 02');
    await callbacks.assertUsageCount(2);
    await callbacks.usageTab.click();
    await callbacks.assertHasUsageItems(2);
    await callbacks.assertUsageRouteText(1, 'GET /test/usages/1');
    await callbacks.assertUsageRouteResponseText(1, 1, 'Response 200');
    await callbacks.assertUsageRouteText(2, 'POST /test/usages/2');
    await callbacks.assertUsageRouteResponseText(2, 1, 'Response 100');
    await callbacks.assertUsageRouteResponseText(2, 2, 'Response 200');
  });

  describe('Execute Callbacks', () => {
    it('should open and start the environment', async () => {
      // close the 3 already opened environments
      await environments.close(1);
      await environments.close(1);
      await environments.close(1);
      await utils.waitForAutosave();
      await browser.reloadSession();

      await environments.open('callbacks');
      await environments.open('basic-data');

      // change port
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.port.setValue(3001);
      // start basic-data
      await environments.start();

      await environments.select(1);
    });

    it('should add a callback', async () => {
      await navigation.switchView('ENV_CALLBACKS');
      await callbacks.add();
      await callbacks.setName('basic call');
      await callbacks.setUri('http://localhost:3001/answer');
      await callbacks.setMethod(1);
    });

    it('should attach callback to each route', async () => {
      await navigation.switchView('ENV_ROUTES');
      await routes.select(1);
      await routes.callbacksTab.click();
      await callbacks.attachCallback();
      await utils.openDropdown('callback0target');
      await utils.selectDropdownItem('callback0target', 7);
    });

    it('should start the environment call each route and verify the callback has been called', async () => {
      await environments.start();
      await environments.select(2);
      await navigation.switchView('ENV_LOGS');

      await http.assertCallWithPort({ method: 'GET', path: '/inline' }, 3000);
      await browser.pause(1000);
      await environmentsLogs.assertCount(1);
    });
  });
});
