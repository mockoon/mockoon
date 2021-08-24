import { Environments } from '@mockoon/commons';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { parse as pathParse, resolve } from 'path';
import { Tests } from 'test/lib/tests';

const dataSamplesPath = './test/data/import/openapi/samples/';
const dataReferencesPath = './test/data/import/openapi/references/';

const testSuites = [
  {
    name: 'Swagger v2 format',
    tests: [
      {
        desc: 'Petstore',
        filePath: dataSamplesPath + 'petstore-v2.yaml',
        referenceFilePath: dataReferencesPath + 'petstore-v2.json',
        environmentTitle: 'Swagger Petstore v2'
      },
      {
        desc: 'GitHub',
        filePath: dataSamplesPath + 'github-v2.yaml',
        referenceFilePath: dataReferencesPath + 'github-v2.json',
        environmentTitle: 'GitHub'
      },
      {
        desc: 'Giphy',
        filePath: dataSamplesPath + 'giphy-v2.yaml',
        referenceFilePath: dataReferencesPath + 'giphy-v2.json',
        environmentTitle: 'Giphy'
      },
      {
        desc: 'Slack',
        filePath: dataSamplesPath + 'slack-v2.yaml',
        referenceFilePath: dataReferencesPath + 'slack-v2.json',
        environmentTitle: 'Slack'
      },
      {
        desc: 'Data.gov',
        filePath: dataSamplesPath + 'datagov-v2.yaml',
        referenceFilePath: dataReferencesPath + 'datagov-v2.json',
        environmentTitle: 'Regulations.gov'
      },
      {
        desc: 'Custom schema',
        filePath: dataSamplesPath + 'custom-schema-v2.yaml',
        referenceFilePath: dataReferencesPath + 'custom-schema-v2.json',
        environmentTitle: 'Sample v2 schema'
      },
      {
        desc: 'Custom schema with no API prefix',
        filePath: dataSamplesPath + 'custom-schema-no-prefix-v2.yaml',
        referenceFilePath:
          dataReferencesPath + 'custom-schema-no-prefix-v2.json',
        environmentTitle: 'Sample v2 schema'
      }
    ]
  },
  {
    name: 'OpenAPI v3 format',
    tests: [
      {
        desc: 'Petstore',
        filePath: dataSamplesPath + 'petstore-v3.yaml',
        referenceFilePath: dataReferencesPath + 'petstore-v3.json',
        environmentTitle: 'Swagger Petstore v3'
      },
      {
        desc: 'Youtube Analytics',
        filePath: dataSamplesPath + 'youtube-v3.yaml',
        referenceFilePath: dataReferencesPath + 'youtube-v3.json',
        environmentTitle: 'YouTube Analytics'
      },
      {
        desc: 'Shutterstock',
        filePath: dataSamplesPath + 'shutterstock-v3.yaml',
        referenceFilePath: dataReferencesPath + 'shutterstock-v3.json',
        environmentTitle: 'Shutterstock API Explorer'
      },
      {
        desc: 'AWS Server migration',
        filePath: dataSamplesPath + 'aws-server-v3.yaml',
        referenceFilePath: dataReferencesPath + 'aws-server-v3.json',
        environmentTitle: 'AWS Server Migration Service'
      },
      {
        desc: 'AWS Cloudfront',
        filePath: dataSamplesPath + 'aws-cloudfront-v3.yaml',
        referenceFilePath: dataReferencesPath + 'aws-cloudfront-v3.json',
        environmentTitle: 'Amazon CloudFront'
      },
      {
        desc: 'Custom schema',
        filePath: dataSamplesPath + 'custom-schema-v3.yaml',
        referenceFilePath: dataReferencesPath + 'custom-schema-v3.json',
        environmentTitle: 'Sample v3 schema'
      },
      {
        desc: 'Custom schema with no API prefix',
        filePath: dataSamplesPath + 'custom-schema-no-prefix-v3.yaml',
        referenceFilePath:
          dataReferencesPath + 'custom-schema-no-prefix-v3.json',
        environmentTitle: 'Sample v3 schema'
      }
    ]
  }
];

describe('Swagger/OpenAPI import', () => {
  testSuites.forEach((testSuite) => {
    describe(testSuite.name, () => {
      testSuite.tests.forEach((testCase) => {
        describe(testCase.desc, () => {
          const tests = new Tests('import', true, true, false);
          const filename = pathParse(testCase.filePath).name;

          it('Should import the file', async () => {
            tests.helpers.mockDialog('showOpenDialog', [testCase.filePath]);
            tests.helpers.mockDialog('showSaveDialog', [
              resolve(`./tmp/storage/${filename}.json`)
            ]);

            tests.helpers.selectMenuEntry('IMPORT_OPENAPI_FILE');

            await tests.app.client.pause(500);

            await tests.helpers.assertHasActiveEnvironment();
            await tests.helpers.assertActiveEnvironmentName(
              testCase.environmentTitle
            );
          });

          it('Environment file content should match reference file', async () => {
            await tests.helpers.waitForAutosave();

            const environmentFile = await fs.readFile(
              `./tmp/storage/${filename}.json`
            );
            const referenceEnvironmentFile = await fs.readFile(
              testCase.referenceFilePath
            );

            const environments: Environments = JSON.parse(
              environmentFile.toString()
            );
            const referenceEnvironments: Environments = JSON.parse(
              referenceEnvironmentFile.toString()
            );

            expect(environments)
              .excludingEvery('uuid')
              .to.deep.equal(referenceEnvironments);
          });
        });
      });
    });
  });
});
