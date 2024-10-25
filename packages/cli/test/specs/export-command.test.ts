import { strictEqual } from 'node:assert';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('Import command', () => {
  before(async () => {
    await mkdir('./tmp', { recursive: true });
  });

  after(async () => {
    await rm('./tmp', { recursive: true });
  });

  it('should export to file', async () => {
    await spawnCli([
      'export',
      '--input',
      './test/data/envs/mock-export.json',
      '--output',
      './tmp/export-file.json'
    ]);

    const jsonFile = await readFile('./tmp/export-file.json');
    const jsonFileContent = JSON.stringify(JSON.parse(jsonFile.toString()));
    const expectedFile = await readFile(
      './test/data/openapi/mock-exported.json'
    );
    const expectedContent = JSON.stringify(JSON.parse(expectedFile.toString()));

    strictEqual(jsonFileContent, expectedContent);

    await rm('./tmp/export-file.json');
  });

  it('should export prettified to file', async () => {
    await spawnCli([
      'export',
      '--input',
      './test/data/envs/mock-export.json',
      '--output',
      './tmp/export-file-prettified.json',
      '--prettify'
    ]);

    const jsonFile = await readFile('./tmp/export-file-prettified.json');
    const jsonFileContent = JSON.stringify(JSON.parse(jsonFile.toString()));
    const expectedFile = await readFile(
      './test/data/openapi/mock-exported-prettified.json'
    );
    const expectedContent = JSON.stringify(JSON.parse(expectedFile.toString()));

    strictEqual(jsonFileContent, expectedContent);

    await rm('./tmp/export-file-prettified.json');
  });

  it('should export prettified to file using aliases', async () => {
    await spawnCli([
      'export',
      '-i',
      './test/data/envs/mock-export.json',
      '-o',
      './tmp/export-file-prettified-alias.json',
      '-p'
    ]);

    const jsonFile = await readFile('./tmp/export-file-prettified-alias.json');
    const jsonFileContent = JSON.stringify(JSON.parse(jsonFile.toString()));
    const expectedFile = await readFile(
      './test/data/openapi/mock-exported-prettified.json'
    );
    const expectedContent = JSON.stringify(JSON.parse(expectedFile.toString()));

    strictEqual(jsonFileContent, expectedContent);

    await rm('./tmp/export-file-prettified-alias.json');
  });

  it('should export from URL', async () => {
    await spawnCli([
      'export',
      '--input',
      'https://raw.githubusercontent.com/mockoon/mockoon/main/packages/cli/test/data/envs/mock-export.json',
      '--output',
      './tmp/export-url.json'
    ]);

    const jsonFile = await readFile('./tmp/export-url.json');
    const jsonFileContent = JSON.stringify(JSON.parse(jsonFile.toString()));
    const expectedFile = await readFile(
      './test/data/openapi/mock-exported.json'
    );
    const expectedContent = JSON.stringify(JSON.parse(expectedFile.toString()));

    strictEqual(jsonFileContent, expectedContent);

    await rm('./tmp/export-url.json');
  });

  it('should export prettified from URL', async () => {
    await spawnCli([
      'export',
      '--input',
      'https://raw.githubusercontent.com/mockoon/mockoon/main/packages/cli/test/data/envs/mock-export.json',
      '--output',
      './tmp/export-url-prettified.json',
      '--prettify'
    ]);

    const jsonFile = await readFile('./tmp/export-url-prettified.json');
    const jsonFileContent = JSON.stringify(JSON.parse(jsonFile.toString()));
    const expectedFile = await readFile(
      './test/data/openapi/mock-exported-prettified.json'
    );
    const expectedContent = JSON.stringify(JSON.parse(expectedFile.toString()));

    strictEqual(jsonFileContent, expectedContent);

    await rm('./tmp/export-url-prettified.json');
  });
});
