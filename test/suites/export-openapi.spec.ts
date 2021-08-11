import { expect } from 'chai';
import { promises as fs } from 'fs';
import { Tests } from 'test/lib/tests';
import { v4 as uuid } from 'uuid';

describe('OpenAPI export', () => {
  const tests = new Tests('export-openapi');

  const filePath = `./tmp/storage/${uuid()}.json`;

  it('Should export the environment and match the reference file', async () => {
    tests.helpers.mockDialog('showSaveDialog', [filePath]);

    tests.helpers.selectMenuEntry('EXPORT_OPENAPI_FILE');

    await tests.helpers.waitForAutosave();

    const exportedFile = await fs.readFile(filePath);
    const referenceFile = await fs.readFile(
      './test/data/export-openapi/reference.json'
    );

    const exportedFileContent = JSON.parse(exportedFile.toString());
    const referenceFileContent = JSON.parse(referenceFile.toString());

    expect(exportedFileContent).to.deep.equal(referenceFileContent);
  });
});
