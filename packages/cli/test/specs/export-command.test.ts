import { strictEqual } from 'node:assert';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { parse as yamlParse } from 'yaml';
import { spawnCli } from '../libs/helpers';

describe('Export command', () => {
  before(async () => {
    await mkdir('./tmp', { recursive: true });
  });

  after(async () => {
    await rm('./tmp', { recursive: true });
  });

  it('should export to file in JSON format', async () => {
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

  it('should export to file in JSON format prettified', async () => {
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

  it('should export to file in YAML format', async () => {
    await spawnCli([
      'export',
      '--input',
      './test/data/envs/mock-export.json',
      '--output',
      './tmp/export-file.yaml',
      '--format',
      'yaml'
    ]);

    const yamlFileContent = await readFile('./tmp/export-file.yaml');
    const expectedContent = await readFile(
      './test/data/openapi/mock-exported.yaml'
    );

    strictEqual(
      JSON.stringify(yamlParse(yamlFileContent.toString())),
      JSON.stringify(yamlParse(expectedContent.toString()))
    );

    await rm('./tmp/export-file.yaml');
  });

  it('should export to file in JSON format prettified using aliases', async () => {
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
