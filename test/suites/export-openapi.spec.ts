import { expect } from 'chai';
import { promises as fs } from 'fs';
import { Tests } from 'test/lib/tests';
import { v1 as uuid } from 'uuid';

describe('OpenAPI export', () => {
  const tests = new Tests('export-openapi');

  const filePath = `./tmp/storage/${uuid()}.json`;

  it('Should export the environment and match the reference file', async () => {
    tests.ipcRenderer.sendSync('SPECTRON_FAKE_DIALOG', [
      {
        method: 'showSaveDialog',
        value: { filePath }
      }
    ]);

    tests.helpers.sendWebContentsAction('EXPORT_OPENAPI_FILE');

    // wait for file save
    await tests.app.client.pause(1000);

    const exportedFile = await fs.readFile(filePath);
    const referenceFile = await fs.readFile(
      './test/data/export-openapi/reference.json'
    );

    const exportedFileContent = JSON.parse(exportedFile.toString());
    const referenceFileContent = JSON.parse(referenceFile.toString());

    expect(exportedFileContent).to.deep.equal(referenceFileContent);
  });
});
