import { test } from '@oclif/test';
import { strictEqual } from 'assert';
import { promises as fs } from 'fs';

describe('Export command', () => {
  describe('Export from file', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        './test/data/envs/mock-export.json',
        '--output',
        './tmp/export-file.json'
      ])
      .finally(() => {
        fs.rm('./tmp/export-file.json');
      })
      .it('should successfully export', async () => {
        const jsonFile = await fs.readFile('./tmp/export-file.json');
        const jsonFileContent = jsonFile.toString();
        const expectedFile = await fs.readFile(
          './test/data/openapi/mock-exported.json'
        );
        const expectedContent = expectedFile.toString();

        strictEqual(jsonFileContent, expectedContent);
      });
  });

  describe('Export prettified from file', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        './test/data/envs/mock-export.json',
        '--output',
        './tmp/export-file-prettified.json',
        '--prettify'
      ])
      .finally(() => {
        fs.rm('./tmp/export-file-prettified.json');
      })
      .it('should successfully export prettified', async () => {
        const jsonFile = await fs.readFile('./tmp/export-file-prettified.json');
        const jsonFileContent = jsonFile.toString();
        const expectedFile = await fs.readFile(
          './test/data/openapi/mock-exported-prettified.json'
        );
        const expectedContent = expectedFile.toString();

        strictEqual(jsonFileContent, expectedContent);
      });
  });

  describe('Export prettified from file using aliases', () => {
    test
      .stdout()
      .command([
        'export',
        '-i',
        './test/data/envs/mock-export.json',
        '-o',
        './tmp/export-file-prettified-alias.json',
        '-p'
      ])
      .finally(() => {
        fs.rm('./tmp/export-file-prettified-alias.json');
      })
      .it('should successfully export prettified', async () => {
        const jsonFile = await fs.readFile(
          './tmp/export-file-prettified-alias.json'
        );
        const jsonFileContent = jsonFile.toString();
        const expectedFile = await fs.readFile(
          './test/data/openapi/mock-exported-prettified.json'
        );
        const expectedContent = expectedFile.toString();

        strictEqual(jsonFileContent, expectedContent);
      });
  });

  describe('Export from URL', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        'https://raw.githubusercontent.com/mockoon/mockoon/main/packages/cli/test/data/envs/mock-export.json',
        '--output',
        './tmp/export-url.json'
      ])
      .finally(() => {
        fs.rm('./tmp/export-url.json');
      })
      .it('should successfully export', async () => {
        const jsonFile = await fs.readFile('./tmp/export-url.json');
        const jsonFileContent = jsonFile.toString();
        const expectedFile = await fs.readFile(
          './test/data/openapi/mock-exported.json'
        );
        const expectedContent = expectedFile.toString();

        strictEqual(jsonFileContent, expectedContent);
      });
  });

  describe('Export prettified from URL', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        'https://raw.githubusercontent.com/mockoon/mockoon/main/packages/cli/test/data/envs/mock-export.json',
        '--output',
        './tmp/export-url-prettified.json',
        '--prettify'
      ])
      .finally(() => {
        fs.rm('./tmp/export-url-prettified.json');
      })
      .it('should successfully export prettified', async () => {
        const jsonFile = await fs.readFile('./tmp/export-url-prettified.json');
        const jsonFileContent = jsonFile.toString();
        const expectedFile = await fs.readFile(
          './test/data/openapi/mock-exported-prettified.json'
        );
        const expectedContent = expectedFile.toString();

        strictEqual(jsonFileContent, expectedContent);
      });
  });
});
