import { resolve } from 'path';
import clipboard from '../libs/clipboard';
import contextMenu from '../libs/context-menu';
import databuckets from '../libs/databuckets';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import file from '../libs/file';
import http from '../libs/http';
import modals from '../libs/modals';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import settings from '../libs/settings';
import utils from '../libs/utils';

describe('Databuckets navigation and deletion', () => {
  it('should open and start the environment', async () => {
    await environments.open('databuckets');
    await settings.open();
    await settings.setSettingValue('settings-faker-seed', '1');
    await modals.close();
  });

  it('should navigate to the databuckets tab and verify the header count', async () => {
    await navigation.switchView('ENV_DATABUCKETS');
    await databuckets.assertCount(3);
    await navigation.assertHeaderValue('ENV_DATABUCKETS', 'Data 3');
  });

  it('should delete the single databucket and verify the header count and message', async () => {
    await databuckets.remove(3);
    await databuckets.assertCount(2);
    await navigation.assertHeaderValue('ENV_DATABUCKETS', 'Data 2');
  });
});

describe('Databuckets addition', () => {
  it('should add a databucket', async () => {
    await databuckets.add();
    await databuckets.assertCount(3);
    await databuckets.assertName('New data');
  });

  it('should create a new random ID when adding a new Databucket', async () => {
    await utils.waitForAutosave();
    const id = await file.getObjectPropertyInFile(
      './tmp/storage/databuckets.json',
      'data.2.id'
    );
    expect(await databuckets.idElement.getText()).toContain(`Unique ID: ${id}`);
  });

  it('should copy the ID to the clipboard via the context menu', async () => {
    await databuckets.copyID(3);
    expect(await databuckets.idElement.getText()).toContain(
      await clipboard.read()
    );
  });
});

describe('Databuckets edition', () => {
  it('should edit a databucket name', async () => {
    await databuckets.setName('My Databucket');

    await utils.waitForAutosave();

    await databuckets.assertName('My Databucket');
    await file.verifyObjectPropertyInFile(
      './tmp/storage/databuckets.json',
      ['data.2.name'],
      ['My Databucket']
    );
  });

  it('should edit a databucket documentation', async () => {
    await databuckets.setDocumentation('Documentation of the databucket');

    await utils.waitForAutosave();

    await databuckets.assertDocumentation('Documentation of the databucket');
    await file.verifyObjectPropertyInFile(
      './tmp/storage/databuckets.json',
      ['data.2.documentation'],
      ['Documentation of the databucket']
    );
  });
});

describe('Databucket duplication', () => {
  it('should duplicate a databucket', async () => {
    await databuckets.duplicate(3);
    await databuckets.assertCount(4);
    await databuckets.assertName('My Databucket (copy)');
  });
});

describe('Databucket duplication to another envionment', () => {
  it('assert the context menu entry is disabled when there is only one env', async () => {
    await contextMenu.assertEntryDisabled('databuckets', 1, 2);
  });

  it("should open duplication modal and verify selected databucket's information on modal", async () => {
    await environments.open('basic-data.json');
    await environments.select(1);
    await navigation.switchView('ENV_DATABUCKETS');
    await databuckets.duplicateToEnv(3);

    await modals.assertExists();

    const modalText = await $('.modal-content .modal-title small').getText();

    expect(modalText).toContain('My Databucket');

    await modals.assertDuplicationModalEnvName('Basic data');
    await modals.assertDuplicationModalEnvHostname('0.0.0.0:3000/');
  });

  it('should duplicate the databucket in another env', async () => {
    await modals.confirmDuplicateToEnvModal(1);
    await databuckets.assertName('My Databucket');
    await databuckets.assertCount(1);
  });
});

describe('Databucket filter', () => {
  it('should get focused when pressing ctrl + shift + f', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_DATABUCKETS');
    await browser.keys([
      process.platform === 'darwin' ? 'Command' : 'Control',
      'Shift',
      'f'
    ]);
    expect(await databuckets.filter.isFocused()).toEqual(true);
  });

  it('should get cleared when pressing escape while focused', async () => {
    await databuckets.setFilter('data');
    await databuckets.filter.click();
    await browser.keys(['Escape']);
    await databuckets.assertFilter('');
  });

  it('should filter databuckets by documentation', async () => {
    await databuckets.select(1);
    await databuckets.setDocumentation('Best databucket ever');
    await databuckets.select(2);
    await databuckets.setName('Still a nice databucket');

    await databuckets.assertCount(4);

    await databuckets.setFilter('Best');
    await browser.pause(100);
    await databuckets.assertCount(1);
    await databuckets.clearFilter();
  });

  it('should filter databuckets by name', async () => {
    await databuckets.select(1);
    await databuckets.setName('First databucket');
    await databuckets.select(2);
    await databuckets.setName('Second databucket');

    await databuckets.assertCount(4);

    await databuckets.setFilter('Second');
    await browser.pause(100);
    await databuckets.assertCount(1);
  });

  it('should reset databuckets filter when clicking on the button Clear filter', async () => {
    await databuckets.clearFilter();
    await browser.pause(100);
    await databuckets.assertCount(4);
  });

  it('should reset databuckets filter when adding a new databucket', async () => {
    await databuckets.setFilter('Second');
    await databuckets.add();
    await databuckets.assertFilter('');
    await databuckets.remove(4);
  });

  it('should reset databuckets filter when switching env', async () => {
    await databuckets.setFilter('Second');
    await dialogs.save(resolve('./tmp/storage/dup-databuckets.json'));
    await environments.duplicate(1);
    await navigation.switchView('ENV_DATABUCKETS');
    await databuckets.assertFilter('');
  });

  it('should reset databuckets filter when duplicating databucket to selected environment', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_DATABUCKETS');
    await databuckets.setFilter('Second');
    await browser.pause(200);
    await databuckets.assertCount(1);

    await contextMenu.click('databuckets', 1, 2);
    await $(
      '.modal-content .modal-body .list-group .list-group-item:first-child'
    ).click();

    await navigation.switchView('ENV_DATABUCKETS');
    await databuckets.assertFilter('');
  });

  it('should reset databuckets filter when adding a new environment', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_DATABUCKETS');

    await databuckets.setFilter('Second');
    await dialogs.save(resolve('./tmp/storage/dup2-databuckets.json'));
    await environments.add();
    await navigation.switchView('ENV_DATABUCKETS');

    await databuckets.assertFilter('');
  });

  it('should reset databuckets filter when removing environment', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_DATABUCKETS');

    await databuckets.setFilter('Second');
    await browser.pause(100);
    await environments.close(2);
    await databuckets.assertFilter('');
  });
});

describe('Databuckets autocompletion', () => {
  it('should open autocompletion menu when pressing ctrl + space in editor', async () => {
    await navigation.switchView('ENV_ROUTES');
    await routes.add();
    await routes.bodyEditor.click();
    await browser.keys(['Control', 'Space']);
    await $('.ace_editor.ace_autocomplete').waitForExist();

    await utils.countElements(
      $$('.ace_editor.ace_autocomplete .ace_content .ace_line'),
      4
    );
  });
});

describe('Databuckets selection in responses', () => {
  it('should generate databucket at server start and always serve the same content', async () => {
    await environments.select(1);
    await routes.select(1);
    await environments.start();
    await http.assertCall({
      method: 'GET',
      path: '/databucket',
      testedResponse: {
        body: '{"response":"Hayley"}'
      }
    });
    await http.assertCall({
      method: 'GET',
      path: '/databucket',
      testedResponse: {
        body: '{"response":"Hayley"}'
      }
    });
  });

  it('should generate databucket with req helper at first call (string) and always serve the same content', async () => {
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=testvalue1',
      testedResponse: { body: 'testvalue1' }
    });
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=testvalue2',
      testedResponse: { body: 'testvalue1' }
    });
  });

  it('should generate databucket with req helper at first call (number) and always serve the same content', async () => {
    await environments.stop();
    await environments.start();
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=560',
      testedResponse: { body: '560' }
    });
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=testvalue2',
      testedResponse: { body: '560' }
    });
  });

  it('should generate databucket with req helper at first call (number) and always serve the same content', async () => {
    await environments.stop();
    await environments.start();
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=560',
      testedResponse: { body: '560' }
    });
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=testvalue2',
      testedResponse: { body: '560' }
    });
  });

  it('should generate databucket with req helper at first call (boolean) and always serve the same content', async () => {
    await environments.stop();
    await environments.start();
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=false',
      testedResponse: { body: 'false' }
    });
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=testvalue2',
      testedResponse: { body: 'false' }
    });
  });

  it('should generate databucket with req helper at first call (null) and always serve the same content', async () => {
    await environments.stop();
    await environments.start();
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=null',
      testedResponse: { body: 'null' }
    });
    await http.assertCall({
      method: 'GET',
      path: '/databucketWithReqHelper?param=testvalue2',
      testedResponse: { body: 'null' }
    });
  });
});
