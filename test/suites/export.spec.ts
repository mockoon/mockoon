import { Export } from '@mockoon/commons';
import { Config } from 'src/app/config';
import { Tests } from 'test/lib/tests';
import { v1 as uuid } from 'uuid';

describe('Environments export', () => {
  describe('Export all environments to a file (JSON)', () => {
    const tests = new Tests('export');

    const filePath = `./tmp/storage/${uuid()}.json`;

    it('Should create an export file with content', async () => {
      tests.ipcRenderer.sendSync('SPECTRON_FAKE_DIALOG', [
        {
          method: 'showSaveDialog',
          value: { filePath }
        }
      ]);

      tests.helpers.sendWebContentsAction('EXPORT_FILE');

      await tests.helpers.checkToastDisplayed(
        'success',
        'Environments have been successfully exported'
      );
      // wait for file save
      await tests.app.client.pause(1000);
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

    it('Should export data without UUIDs', async () => {
      await tests.helpers.verifyObjectPropertyInFile(
        filePath,
        [
          'data.0.item.uuid',
          'data.0.item.routes.0.uuid',
          'data.0.item.routes.0.responses.0.uuid',
          'data.1.item.uuid',
          'data.1.item.routes.0.uuid',
          'data.1.item.routes.0.responses.0.uuid'
        ],
        ['', '', '', '', '', '']
      );
    });
  });

  describe('Export active environment to a file (JSON)', () => {
    const tests = new Tests('export');

    const filePath = `./tmp/storage/${uuid()}.json`;

    it('Should create an export file with content', async () => {
      tests.ipcRenderer.sendSync('SPECTRON_FAKE_DIALOG', [
        {
          method: 'showSaveDialog',
          value: { filePath }
        }
      ]);

      tests.helpers.sendWebContentsAction('EXPORT_FILE_SELECTED');

      await tests.helpers.checkToastDisplayed(
        'success',
        'Environment has been successfully exported'
      );
      // wait for file save
      await tests.app.client.pause(1000);
      await tests.helpers.verifyObjectPropertyInFile(
        filePath,
        ['source', 'data.0.type', 'data.0.item.name', 'data.1'],
        [`mockoon:${Config.appVersion}`, 'environment', 'Export env', undefined]
      );
    });

    it('Should export data without UUIDs', async () => {
      await tests.helpers.verifyObjectPropertyInFile(
        filePath,
        [
          'data.0.item.uuid',
          'data.0.item.routes.0.uuid',
          'data.0.item.routes.0.responses.0.uuid'
        ],
        ['', '', '']
      );
    });
  });

  describe('Export environment to the clipboard', () => {
    const tests = new Tests('export');

    it('Should copy environment to clipboard wrapped with export info', async () => {
      await tests.helpers.contextMenuClick(
        '.environments-menu .menu-list .nav-item:first-of-type',
        4
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
        2
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
