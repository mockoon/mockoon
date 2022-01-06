import { Environment } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { parse as pathParse, resolve } from 'path';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import menu from '../libs/menu';
import utils from '../libs/utils';

const dataSamplesPath = './test/data/res/import-openapi/samples/';
const dataReferencesPath = './test/data/res/import-openapi/references/';

const removeUUIDs = (environment: Environment) => {
  delete environment.uuid;
  environment.routes.forEach((route) => {
    delete route.uuid;

    route.responses.forEach((response) => {
      delete response.uuid;
    });
  });
};

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
          const filename = pathParse(testCase.filePath).name;

          it('should import the file', async () => {
            await dialogs.open(testCase.filePath);
            await dialogs.save(resolve(`./tmp/storage/${filename}.json`));

            await menu.click('IMPORT_OPENAPI_FILE');

            await browser.pause(500);

            await environments.assertActiveMenuEntryText(
              testCase.environmentTitle
            );
          });

          it('should match the reference file', async () => {
            await utils.waitForAutosave();

            const environmentFile = await fs.readFile(
              `./tmp/storage/${filename}.json`
            );
            const referenceEnvironmentFile = await fs.readFile(
              testCase.referenceFilePath
            );

            const environment: Environment = JSON.parse(
              environmentFile.toString()
            );
            const referenceEnvironment: Environment = JSON.parse(
              referenceEnvironmentFile.toString()
            );
            removeUUIDs(environment);
            removeUUIDs(referenceEnvironment);

            expect(environment).toEqual(referenceEnvironment);

            await environments.close(1);
          });
        });
      });
    });
  });
});
