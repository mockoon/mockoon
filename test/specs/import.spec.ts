import { HighestMigrationId } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { Config } from '../../src/shared/config';
import clipboard from '../libs/clipboard';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import file from '../libs/file';
import menu from '../libs/menu';
import routes from '../libs/routes';
import utils from '../libs/utils';

/**
 * New cases should only be added if the import system evolve, not if new migrations are added. Use migrations specs for this case.
 *
 * Only the new import format (>= 1.7.0) is tested. Old format test were removed for v1.16.0
 */

describe('Environments import', () => {
  describe('Import new format (>= 1.7.0)', () => {
    describe('Import environment without route from file', () => {
      it('should be able to import a single environment without route from a file', async () => {
        await dialogs.open('./test/data/res/import/import-empty-env.json');
        await dialogs.save(resolve('./tmp/storage/empty-env.json'));

        await menu.click('IMPORT_FILE');
        await browser.pause(500);

        await environments.assertActiveMenuEntryText(
          'Environment without route'
        );

        await environments.start();

        await utils.waitForAutosave();
        await file.verifyObjectPropertyInFile(
          './tmp/storage/empty-env.json',
          'name',
          'Environment without route'
        );

        await environments.close(1);
      });
    });

    describe('Environment import from file', () => {
      it('should be able to import multiple environments from the same file and migrate them', async () => {
        await dialogs.open('./test/data/res/import/import-full.json');
        await dialogs.save(resolve('./tmp/storage/import-full-1.json'));
        await dialogs.save(resolve('./tmp/storage/import-full-2.json'));

        await menu.click('IMPORT_FILE');
        await browser.pause(500);

        await environments.assertActiveMenuEntryText('Import new format 2');
        await environments.start();
        await environments.select(1);
        await environments.assertActiveMenuEntryText('Import new format 1');
        await environments.start();

        await utils.waitForAutosave();
        await file.verifyObjectPropertyInFile(
          './tmp/storage/import-full-1.json',
          'lastMigration',
          HighestMigrationId
        );
        await file.verifyObjectPropertyInFile(
          './tmp/storage/import-full-2.json',
          'lastMigration',
          HighestMigrationId
        );
        await environments.close(1);
        await environments.close(1);
      });
    });

    describe('Multiple environments import from clipboard', () => {
      it('should import an environment from clipboard', async () => {
        const fileContent = await fs.readFile(
          './test/data/res/import/import-full.json',
          'utf-8'
        );
        await clipboard.write(fileContent);

        await dialogs.save(resolve('./tmp/storage/import-full-1.json'));
        await dialogs.save(resolve('./tmp/storage/import-full-2.json'));

        await menu.click('IMPORT_CLIPBOARD');
        await browser.pause(500);

        await environments.assertActiveMenuEntryText('Import new format 2');

        await environments.close(1);
        await environments.close(1);
      });
    });

    describe('Route import from clipboard - same version', () => {
      it('should import a route from clipboard and create an environment if has none', async () => {
        const fileContent = await fs.readFile(
          './test/data/res/import/import-route.json',
          'utf-8'
        );

        await clipboard.write(
          fileContent.replace('##appVersion##', Config.appVersion)
        );

        await dialogs.save(resolve('./tmp/storage/import-route.json'));

        await menu.click('IMPORT_CLIPBOARD');
        await browser.pause(500);

        await environments.assertActiveMenuEntryText('Import route');
        await routes.assertActiveMenuEntryText('GET\n/answer');

        await environments.close(1);
      });
    });

    describe('Route import from clipboard - different version', () => {
      it('should reject a route if version is different', async () => {
        const fileContent = await fs.readFile(
          './test/data/res/import/import-route.json',
          'utf-8'
        );

        await clipboard.write(fileContent.replace('##appVersion##', '0.0.0'));

        await menu.click('IMPORT_CLIPBOARD');
        await browser.pause(500);

        await utils.checkToastDisplayed(
          'warning',
          'Route has incompatible version 0.0.0 and cannot be imported'
        );

        await routes.assertCount(0);
      });
    });
  });
});
