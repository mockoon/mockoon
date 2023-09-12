import { test } from '@oclif/test';
import * as chai from 'chai';
import { expect } from 'chai';
import chaiExclude from 'chai-exclude';
import { promises as fs } from 'fs';

chai.use(chaiExclude);

describe('Import command', () => {
  describe('Import from JSON file', () => {
    test
      .stdout()
      .command([
        'import',
        '--input',
        './test/data/openapi/petstore.json',
        '--output',
        './tmp/import-json-file.json'
      ])
      .finally(() => {
        fs.rm('./tmp/import-json-file.json');
      })
      .it('should successfully import', async () => {
        const importedFile = await fs.readFile('./tmp/import-json-file.json');
        const importedContent = importedFile.toString();
        const importedJson = JSON.parse(importedContent);
        const expectedFile = await fs.readFile(
          './test/data/envs/petstore-imported.json'
        );
        const expectedContent = JSON.parse(expectedFile.toString());

        expect(importedContent).to.not.contains('\n');
        expect(importedJson)
          .excludingEvery('uuid')
          .to.deep.equal(expectedContent);
      });
  });

  describe('Import prettified from JSON file', () => {
    test
      .stdout()
      .command([
        'import',
        '--input',
        './test/data/openapi/petstore.json',
        '--output',
        './tmp/import-json-file-prettified.json',
        '--prettify'
      ])
      .finally(() => {
        fs.rm('./tmp/import-json-file-prettified.json');
      })
      .it('should successfully import prettified', async () => {
        const importedFile = await fs.readFile(
          './tmp/import-json-file-prettified.json'
        );
        const importedContent = importedFile.toString();
        const importedJson = JSON.parse(importedContent);
        const expectedFile = await fs.readFile(
          './test/data/envs/petstore-imported.json'
        );
        const expectedContent = JSON.parse(expectedFile.toString());

        expect(importedContent).to.contains('{\n  ');
        expect(importedJson)
          .excludingEvery('uuid')
          .to.deep.equal(expectedContent);
      });
  });

  describe('Import prettified from JSON file using aliases', () => {
    test
      .stdout()
      .command([
        'import',
        '-i',
        './test/data/openapi/petstore.json',
        '-o',
        './tmp/import-json-file-prettified-alias.json',
        '-p'
      ])
      .finally(() => {
        fs.rm('./tmp/import-json-file-prettified-alias.json');
      })
      .it('should successfully import prettified', async () => {
        const importedFile = await fs.readFile(
          './tmp/import-json-file-prettified-alias.json'
        );
        const importedContent = importedFile.toString();
        const importedJson = JSON.parse(importedContent);
        const expectedFile = await fs.readFile(
          './test/data/envs/petstore-imported.json'
        );
        const expectedContent = JSON.parse(expectedFile.toString());

        expect(importedContent).to.contains('{\n  ');
        expect(importedJson)
          .excludingEvery('uuid')
          .to.deep.equal(expectedContent);
      });
  });

  describe('Import from YAML file', () => {
    test
      .stdout()
      .command([
        'import',
        '--input',
        './test/data/openapi/petstore.yaml',
        '--output',
        './tmp/import-yaml-file.json'
      ])
      .finally(() => {
        fs.rm('./tmp/import-yaml-file.json');
      })
      .it('should successfully import', async () => {
        const importedFile = await fs.readFile('./tmp/import-yaml-file.json');
        const importedContent = importedFile.toString();
        const importedJson = JSON.parse(importedContent);
        const expectedFile = await fs.readFile(
          './test/data/envs/petstore-imported.json'
        );
        const expectedContent = JSON.parse(expectedFile.toString());

        expect(importedContent).to.not.contains('\n');
        expect(importedJson)
          .excludingEvery('uuid')
          .to.deep.equal(expectedContent);
      });
  });

  describe('Import prettified from YAML file', () => {
    test
      .stdout()
      .command([
        'import',
        '--input',
        './test/data/openapi/petstore.yaml',
        '--output',
        './tmp/import-yaml-file-prettified.json',
        '--prettify'
      ])
      .finally(() => {
        fs.rm('./tmp/import-yaml-file-prettified.json');
      })
      .it('should successfully import prettified', async () => {
        const importedFile = await fs.readFile(
          './tmp/import-yaml-file-prettified.json'
        );
        const importedContent = importedFile.toString();
        const importedJson = JSON.parse(importedContent);
        const expectedFile = await fs.readFile(
          './test/data/envs/petstore-imported.json'
        );
        const expectedContent = JSON.parse(expectedFile.toString());

        expect(importedContent).to.contains('{\n  ');
        expect(importedJson)
          .excludingEvery('uuid')
          .to.deep.equal(expectedContent);
      });
  });

  describe('Import from URL', () => {
    test
      .stdout()
      .command([
        'import',
        '--input',
        'https://github.com/mockoon/mockoon/raw/main/packages/cli/test/data/openapi/petstore.json',
        '--output',
        './tmp/import-url-file.json'
      ])
      .finally(() => {
        fs.rm('./tmp/import-url-file.json');
      })
      .it('should successfully import', async () => {
        const importedFile = await fs.readFile('./tmp/import-url-file.json');
        const importedContent = importedFile.toString();
        const importedJson = JSON.parse(importedContent);
        const expectedFile = await fs.readFile(
          './test/data/envs/petstore-imported.json'
        );
        const expectedContent = JSON.parse(expectedFile.toString());

        expect(importedContent).to.not.contains('\n');
        expect(importedJson)
          .excludingEvery('uuid')
          .to.deep.equal(expectedContent);
      });
  });

  describe('Import prettified from URL', () => {
    test
      .stdout()
      .command([
        'import',
        '--input',
        'https://github.com/mockoon/mockoon/raw/main/packages/cli/test/data/openapi/petstore.json',
        '--output',
        './tmp/import-url-file-prettified.json',
        '--prettify'
      ])
      .finally(() => {
        fs.rm('./tmp/import-url-file-prettified.json');
      })
      .it('should successfully import prettified', async () => {
        const importedFile = await fs.readFile(
          './tmp/import-url-file-prettified.json'
        );
        const importedContent = importedFile.toString();
        const importedJson = JSON.parse(importedContent);
        const expectedFile = await fs.readFile(
          './test/data/envs/petstore-imported.json'
        );
        const expectedContent = JSON.parse(expectedFile.toString());

        expect(importedContent).to.contains('{\n  ');
        expect(importedJson)
          .excludingEvery('uuid')
          .to.deep.equal(expectedContent);
      });
  });
});
