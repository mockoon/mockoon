import { test } from '@oclif/test';
import { expect } from 'chai';
import { promises as fs } from 'fs';

describe('Export command', () => {
  describe('Export from file', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        './test/data/envs/mock1.json',
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
          './test/data/openapi/mock1-exported.json'
        );
        const expectedContent = expectedFile.toString();

        expect(jsonFileContent).to.equal(expectedContent);
      });
  });

  describe('Export prettified from file', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        './test/data/envs/mock1.json',
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
          './test/data/openapi/mock1-exported-prettified.json'
        );
        const expectedContent = expectedFile.toString();

        expect(jsonFileContent).to.equal(expectedContent);
      });
  });

  describe('Export prettified from file using aliases', () => {
    test
      .stdout()
      .command([
        'export',
        '-i',
        './test/data/envs/mock1.json',
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
          './test/data/openapi/mock1-exported-prettified.json'
        );
        const expectedContent = expectedFile.toString();

        expect(jsonFileContent).to.equal(expectedContent);
      });
  });

  describe('Export from URL', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        'https://raw.githubusercontent.com/mockoon/mockoon/main/packages/cli/test/data/envs/mock1.json',
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
          './test/data/openapi/mock1-exported.json'
        );
        const expectedContent = expectedFile.toString();

        expect(jsonFileContent).to.equal(expectedContent);
      });
  });

  describe('Export prettified from URL', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        'https://raw.githubusercontent.com/mockoon/mockoon/main/packages/cli/test/data/envs/mock1.json',
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
          './test/data/openapi/mock1-exported-prettified.json'
        );
        const expectedContent = expectedFile.toString();

        expect(jsonFileContent).to.equal(expectedContent);
      });
  });

  describe('Export prettified from legacy file', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        './test/data/legacy-export-file/export.json',
        '--output',
        './tmp/export-legacy-file.json',
        '--prettify'
      ])
      .finally(() => {
        fs.rm('./tmp/export-legacy-file.json');
      })
      .it('should successfully export prettified', async () => {
        const jsonFile = await fs.readFile('./tmp/export-legacy-file.json');
        const jsonFileContent = jsonFile.toString();
        const expectedFile = await fs.readFile(
          './test/data/openapi/legacy-exported.json'
        );
        const expectedContent = expectedFile.toString();

        expect(jsonFileContent).to.equal(expectedContent);
      });
  });

  describe('Export prettified from legacy file having multiple envs', () => {
    test
      .stdout()
      .command([
        'export',
        '--input',
        './test/data/legacy-export-file/multi.json',
        '--output',
        './tmp/export-multi-legacy-file.json',
        '--prettify'
      ])
      .catch((context) => {
        expect(context.message).to.equal('Only one environment is allowed');
      })
      .it('should fail export');
  });
});
