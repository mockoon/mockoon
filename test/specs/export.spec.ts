import { Export } from '@mockoon/commons';
import { v4 as uuid } from 'uuid';
import { Config } from '../../src/shared/config';
import clipboard from '../libs/clipboard';
import contextMenu from '../libs/context-menu';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import file from '../libs/file';
import menu from '../libs/menu';
import utils from '../libs/utils';

describe('Environments export', () => {
  it('should open the environment with routes', async () => {
    await environments.open('export-1');
    await environments.open('export-2');
  });

  describe('Export all environments to a file (JSON)', () => {
    const filePath = `./tmp/storage/${uuid()}.json`;

    it('should create an export file with content', async () => {
      await dialogs.save(filePath);
      await menu.click('EXPORT_FILE');
      await browser.pause(500);

      await utils.checkToastDisplayed(
        'success',
        'Environments have been successfully exported'
      );
      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        filePath,
        [
          'source',
          'data.0.type',
          'data.0.item.name',
          'data.1.type',
          'data.1.item.name'
        ],
        [
          `mockoon:${Config.appVersion}`,
          'environment',
          'Export env',
          'environment',
          'Alt export env'
        ]
      );
    });
  });

  describe('Export active environment to a file (JSON)', () => {
    const filePath = `./tmp/storage/${uuid()}.json`;

    it('should create an export file with content', async () => {
      await environments.select(1);
      await dialogs.save(filePath);
      await menu.click('EXPORT_FILE_SELECTED');
      await browser.pause(500);

      await utils.checkToastDisplayed(
        'success',
        'Environment has been successfully exported'
      );
      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        filePath,
        ['source', 'data.0.type', 'data.0.item.name', 'data.1'],
        [`mockoon:${Config.appVersion}`, 'environment', 'Export env', undefined]
      );
    });
  });

  describe('Export environment to the clipboard', () => {
    it('should copy environment to clipboard wrapped with export info', async () => {
      await contextMenu.click('environments', 1, 2);

      const clipboardContent = await clipboard.read();
      const importedData: Export = JSON.parse(clipboardContent);

      await utils.checkToastDisplayed(
        'success',
        'Environment has been successfully copied to the clipboard'
      );
      file.verifyObjectProperty(
        importedData,
        ['source', 'data.0.type', 'data.0.item.name'],
        [`mockoon:${Config.appVersion}`, 'environment', 'Export env']
      );
    });
  });

  describe('Export route to the clipboard', () => {
    it('should copy route to clipboard wrapped with export info', async () => {
      await contextMenu.click('routes', 1, 3);

      const clipboardContent = await clipboard.read();
      const importedData: Export = JSON.parse(clipboardContent);

      await utils.checkToastDisplayed(
        'success',
        'Route has been successfully copied to the clipboard'
      );
      file.verifyObjectProperty(
        importedData,
        ['source', 'data.0.type', 'data.0.item.method', 'data.0.item.endpoint'],
        [`mockoon:${Config.appVersion}`, 'route', 'get', 'answer']
      );
    });
  });
});
