import { generateUUID } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { resolve } from 'node:path';
import { parse as yamlParse } from 'yaml';
import commandPalette from '../libs/command-palette';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import utils from '../libs/utils';

describe('OpenAPI export', () => {
  it('should open the environment', async () => {
    await environments.open('openapi');
  });

  it('should export the environment and match the reference file (JSON)', async () => {
    const filePath = resolve(`./tmp/storage/${generateUUID()}.json`);
    await dialogs.save(filePath);

    await commandPalette.open();
    await commandPalette.executeCommandClickById(
      'EXPORT_ENVIRONMENT_OPENAPI_JSON'
    );

    await utils.waitForAutosave();

    const exportedFile = await fs.readFile(filePath);
    const referenceFile = await fs.readFile(
      resolve('./test/data/res/export-openapi/reference.json')
    );

    const exportedFileContent = JSON.parse(exportedFile.toString());
    const referenceFileContent = JSON.parse(referenceFile.toString());

    expect(exportedFileContent).toEqual(referenceFileContent);
  });

  it('should export the environment and match the reference file (YAML)', async () => {
    const filePath = resolve(`./tmp/storage/${generateUUID()}.yaml`);
    await dialogs.save(filePath);

    await commandPalette.open();
    await commandPalette.executeCommandClickById(
      'EXPORT_ENVIRONMENT_OPENAPI_YAML'
    );

    await utils.waitForAutosave();

    const exportedFile = await fs.readFile(filePath);
    const referenceFile = await fs.readFile(
      resolve('./test/data/res/export-openapi/reference.yaml')
    );

    expect(yamlParse(exportedFile.toString())).toEqual(
      yamlParse(referenceFile.toString())
    );
  });
});
