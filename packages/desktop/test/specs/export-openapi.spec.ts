import { generateUUID } from '@mockoon/commons';
import { promises as fs } from 'fs';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import menu from '../libs/menu';
import utils from '../libs/utils';

describe('OpenAPI export', () => {
  it('should open the environment', async () => {
    await environments.open('openapi');
  });

  const filePath = `./tmp/storage/${generateUUID()}.json`;

  it('should export the environment and match the reference file', async () => {
    await dialogs.save(filePath);

    await menu.click('MENU_EXPORT_OPENAPI_FILE');

    await utils.waitForAutosave();

    const exportedFile = await fs.readFile(filePath);
    const referenceFile = await fs.readFile(
      './test/data/res/export-openapi/reference.json'
    );

    const exportedFileContent = JSON.parse(exportedFile.toString());
    const referenceFileContent = JSON.parse(referenceFile.toString());

    expect(exportedFileContent).toEqual(referenceFileContent);
  });
});
