import { deepStrictEqual, ok } from 'node:assert';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

const clearAllUuids = (obj: any) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key === 'uuid') {
        obj[key] = '';
      } else {
        clearAllUuids(obj[key]);
      }
    }
  }

  return obj;
};

describe('Import command', () => {
  before(async () => {
    await mkdir('./tmp', { recursive: true });
  });

  after(async () => {
    await rm('./tmp', { recursive: true });
  });

  it('should import from JSON file', async () => {
    await spawnCli([
      'import',
      '--input',
      './test/data/openapi/petstore.json',
      '--output',
      './tmp/import-json-file.json'
    ]);

    const importedFile = await readFile('./tmp/import-json-file.json');
    const importedContent = importedFile.toString();
    const importedJson = clearAllUuids(JSON.parse(importedContent));
    const expectedFile = await readFile(
      './test/data/envs/petstore-imported.json'
    );
    const expectedContent = clearAllUuids(JSON.parse(expectedFile.toString()));

    ok(!importedContent.includes('\n'));
    deepStrictEqual(importedJson, expectedContent);

    await rm('./tmp/import-json-file.json');
  });

  it('should import prettified from JSON file', async () => {
    await spawnCli([
      'import',
      '--input',
      './test/data/openapi/petstore.json',
      '--output',
      './tmp/import-json-file-prettified.json',
      '--prettify'
    ]);

    const importedFile = await readFile(
      './tmp/import-json-file-prettified.json'
    );
    const importedContent = importedFile.toString();
    const importedJson = clearAllUuids(JSON.parse(importedContent));
    const expectedFile = await readFile(
      './test/data/envs/petstore-imported.json'
    );
    const expectedContent = clearAllUuids(JSON.parse(expectedFile.toString()));

    ok(importedContent.includes('{\n  '));
    deepStrictEqual(importedJson, expectedContent);

    await rm('./tmp/import-json-file-prettified.json');
  });

  it('should import prettified from JSON file with aliases', async () => {
    await spawnCli([
      'import',
      '-i',
      './test/data/openapi/petstore.json',
      '-o',
      './tmp/import-json-file-prettified-alias.json',
      '-p'
    ]);

    const importedFile = await readFile(
      './tmp/import-json-file-prettified-alias.json'
    );
    const importedContent = importedFile.toString();
    const importedJson = clearAllUuids(JSON.parse(importedContent));
    const expectedFile = await readFile(
      './test/data/envs/petstore-imported.json'
    );
    const expectedContent = clearAllUuids(JSON.parse(expectedFile.toString()));

    ok(importedContent.includes('{\n  '));
    deepStrictEqual(importedJson, expectedContent);

    await rm('./tmp/import-json-file-prettified-alias.json');
  });

  it('should import from YAML file', async () => {
    await spawnCli([
      'import',
      '--input',
      './test/data/openapi/petstore.yaml',
      '--output',
      './tmp/import-yaml-file.json'
    ]);

    const importedFile = await readFile('./tmp/import-yaml-file.json');
    const importedContent = importedFile.toString();
    const importedJson = clearAllUuids(JSON.parse(importedContent));
    const expectedFile = await readFile(
      './test/data/envs/petstore-imported.json'
    );
    const expectedContent = clearAllUuids(JSON.parse(expectedFile.toString()));

    ok(!importedContent.includes('\n'));
    deepStrictEqual(importedJson, expectedContent);

    await rm('./tmp/import-yaml-file.json');
  });

  it('should import prettified from YAML file', async () => {
    await spawnCli([
      'import',
      '--input',
      './test/data/openapi/petstore.yaml',
      '--output',
      './tmp/import-yaml-file-prettified.json',
      '--prettify'
    ]);

    const importedFile = await readFile(
      './tmp/import-yaml-file-prettified.json'
    );
    const importedContent = importedFile.toString();
    const importedJson = clearAllUuids(JSON.parse(importedContent));
    const expectedFile = await readFile(
      './test/data/envs/petstore-imported.json'
    );
    const expectedContent = clearAllUuids(JSON.parse(expectedFile.toString()));

    ok(importedContent.includes('{\n  '));
    deepStrictEqual(importedJson, expectedContent);

    await rm('./tmp/import-yaml-file-prettified.json');
  });

  it('should import from URL', async () => {
    await spawnCli([
      'import',
      '--input',
      'https://github.com/mockoon/mockoon/raw/main/packages/cli/test/data/openapi/petstore.json',
      '--output',
      './tmp/import-url-file.json'
    ]);

    const importedFile = await readFile('./tmp/import-url-file.json');
    const importedContent = importedFile.toString();
    const importedJson = clearAllUuids(JSON.parse(importedContent));
    const expectedFile = await readFile(
      './test/data/envs/petstore-imported.json'
    );
    const expectedContent = clearAllUuids(JSON.parse(expectedFile.toString()));

    ok(!importedContent.includes('\n'));
    deepStrictEqual(importedJson, expectedContent);

    await rm('./tmp/import-url-file.json');
  });

  it('should import prettified from URL', async () => {
    await spawnCli([
      'import',
      '--input',
      'https://github.com/mockoon/mockoon/raw/main/packages/cli/test/data/openapi/petstore.json',
      '--output',
      './tmp/import-url-file-prettified.json',
      '--prettify'
    ]);

    const importedFile = await readFile(
      './tmp/import-url-file-prettified.json'
    );
    const importedContent = importedFile.toString();
    const importedJson = clearAllUuids(JSON.parse(importedContent));
    const expectedFile = await readFile(
      './test/data/envs/petstore-imported.json'
    );
    const expectedContent = clearAllUuids(JSON.parse(expectedFile.toString()));

    ok(importedContent.includes('{\n  '));
    deepStrictEqual(importedJson, expectedContent);

    await rm('./tmp/import-url-file-prettified.json');
  });
});
