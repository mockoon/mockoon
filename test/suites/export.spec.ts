import { Export } from '@mockoon/commons';
import { Config } from 'src/renderer/app/config';
import { Tests } from 'test/lib/tests';
import { v4 as uuid } from 'uuid';

describe('Environments export', () => {
  describe('Export all environments to a file (JSON)', () => {
    const tests = new Tests('export');

    const filePath = `./tmp/storage/${uuid()}.json`;

    it('Should create an export file with content', async () => {
      tests.helpers.mockDialog('showSaveDialog', [filePath]);

      tests.helpers.selectMenuEntry('EXPORT_FILE');

      await tests.app.client.pause(500);

      await tests.helpers.checkToastDisplayed(
        'success',
        'Environments have been successfully exported'
      );
      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
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
    const tests = new Tests('export');

    const filePath = `./tmp/storage/${uuid()}.json`;

    it('Should create an export file with content', async () => {
      tests.helpers.mockDialog('showSaveDialog', [filePath]);

      tests.helpers.selectMenuEntry('EXPORT_FILE_SELECTED');

      await tests.app.client.pause(500);

      await tests.helpers.checkToastDisplayed(
        'success',
        'Environment has been successfully exported'
      );
      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        filePath,
        ['source', 'data.0.type', 'data.0.item.name', 'data.1'],
        [`mockoon:${Config.appVersion}`, 'environment', 'Export env', undefined]
      );
    });
  });

  describe('Export environment to the clipboard', () => {
    const tests = new Tests('export');

    it('Should copy environment to clipboard wrapped with export info', async () => {
      await tests.helpers.contextMenuClick(
        '.environments-menu .menu-list .nav-item:first-of-type',
        2
      );

      const clipboardContent = await tests.app.electron.clipboard.readText();
      const importedData: Export = JSON.parse(clipboardContent);

      await tests.helpers.checkToastDisplayed(
        'success',
        'Environment has been successfully copied to the clipboard'
      );
      await tests.helpers.verifyObjectProperty(
        importedData,
        ['source', 'data.0.type', 'data.0.item.name'],
        [`mockoon:${Config.appVersion}`, 'environment', 'Export env']
      );
    });
  });

  describe('Export route to the clipboard', () => {
    const tests = new Tests('export');

    it('Should copy route to clipboard wrapped with export info', async () => {
      await tests.helpers.contextMenuClick(
        '.routes-menu .menu-list .nav-item:first-of-type',
        3
      );

      const clipboardContent = await tests.app.electron.clipboard.readText();
      const importedData: Export = JSON.parse(clipboardContent);

      await tests.helpers.checkToastDisplayed(
        'success',
        'Route has been successfully copied to the clipboard'
      );
      await tests.helpers.verifyObjectProperty(
        importedData,
        ['source', 'data.0.type', 'data.0.item.method', 'data.0.item.endpoint'],
        [`mockoon:${Config.appVersion}`, 'route', 'get', 'answer']
      );
    });
  });
});
