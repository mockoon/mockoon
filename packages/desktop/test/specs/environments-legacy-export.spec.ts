import { promises as fs } from 'fs';
import { resolve } from 'path';
import clipboard from '../libs/clipboard';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import file from '../libs/file';
import menu from '../libs/menu';
import modals from '../libs/modals';
import utils from '../libs/utils';

describe('Open environment legacy export file', () => {
  it('should be able to open an old legacy export file', async () => {
    await fs.copyFile(
      './test/data/res/legacy-export/environment-legacy-export.json',
      './tmp/storage/environment-legacy-export.json'
    );
    await environments.open('environment-legacy-export', false);

    await modals.assertTitle('Legacy export format detected');
    await $('.modal-footer .btn:first-of-type').click();
    await environments.assertCount(1);
    await environments.assertActiveMenuEntryText('Environment legacy export');

    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/environment-legacy-export.json',
      'name',
      'Environment legacy export'
    );

    await environments.close(1);
  });

  it('should be able to create a new environment from a legacy export file copied to clipboard', async () => {
    const fileContent = (
      await fs.readFile(
        './test/data/res/legacy-export/environment-legacy-export.json'
      )
    ).toString();
    await clipboard.write(fileContent);

    await dialogs.save(
      resolve('./tmp/storage/new-environment-clipboard-legacy.json')
    );
    await menu.click('MENU_NEW_ENVIRONMENT_CLIPBOARD');
    await browser.pause(500);

    await modals.assertTitle('Legacy export format detected');
    await $('.modal-footer .btn:first-of-type').click();
    await browser.pause(100);
    await environments.assertCount(1);
    await environments.assertActiveMenuEntryText('Environment legacy export');

    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/new-environment-clipboard-legacy.json',
      'name',
      'Environment legacy export'
    );

    await environments.close(1);
  });
});
