import { Environment } from '@mockoon/commons';
import { readFile } from 'node:fs/promises';
import { parse as pathParse, resolve } from 'path';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import utils from '../libs/utils';

const dataSamplesPath = './test/data/res/import-openapi/samples/';
const dataReferencesPath = './test/data/res/import-openapi/references/';

const cleanEnv = (environment: Environment) => {
  environment.port = 3000;
  environment.uuid = '';

  environment.routes.forEach((route) => {
    route.uuid = '';

    route.responses.forEach((response) => {
      response.uuid = '';
    });
  });

  environment.folders.forEach((folder) => {
    folder.children.forEach((child) => {
      child.uuid = '';
    });

    folder.uuid = '';
  });

  environment.rootChildren.forEach((child) => {
    child.uuid = '';
  });
};

const testSuites = [
  {
    name: 'Swagger v2 format',
    tests: [
      {
        desc: 'should import Petstore',
        filePath: dataSamplesPath + 'petstore-v2.yaml',
        referenceFilePath: dataReferencesPath + 'petstore-v2.json',
        environmentTitle: 'Swagger Petstore v2'
      },
      {
        desc: 'should import GitHub',
        filePath: dataSamplesPath + 'github-v2.yaml',
        referenceFilePath: dataReferencesPath + 'github-v2.json',
        environmentTitle: 'GitHub'
      },
      {
        desc: 'should import Giphy',
        filePath: dataSamplesPath + 'giphy-v2.yaml',
        referenceFilePath: dataReferencesPath + 'giphy-v2.json',
        environmentTitle: 'Giphy'
      },
      {
        desc: 'should import Slack',
        filePath: dataSamplesPath + 'slack-v2.yaml',
        referenceFilePath: dataReferencesPath + 'slack-v2.json',
        environmentTitle: 'Slack'
      },
      {
        desc: 'should import Data.gov',
        filePath: dataSamplesPath + 'datagov-v2.yaml',
        referenceFilePath: dataReferencesPath + 'datagov-v2.json',
        environmentTitle: 'Regulations.gov'
      },
      {
        desc: 'should import Custom schema',
        filePath: dataSamplesPath + 'custom-schema-v2.yaml',
        referenceFilePath: dataReferencesPath + 'custom-schema-v2.json',
        environmentTitle: 'Sample v2 schema'
      },
      {
        desc: 'should import Custom schema with no API prefix',
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
        desc: 'should import Petstore',
        filePath: dataSamplesPath + 'petstore-v3.yaml',
        referenceFilePath: dataReferencesPath + 'petstore-v3.json',
        environmentTitle: 'Swagger Petstore v3'
      },
      {
        desc: 'should import Youtube Analytics',
        filePath: dataSamplesPath + 'youtube-v3.yaml',
        referenceFilePath: dataReferencesPath + 'youtube-v3.json',
        environmentTitle: 'YouTube Analytics'
      },
      {
        desc: 'should import Shutterstock',
        filePath: dataSamplesPath + 'shutterstock-v3.yaml',
        referenceFilePath: dataReferencesPath + 'shutterstock-v3.json',
        environmentTitle: 'Shutterstock API Explorer'
      },
      {
        desc: 'should import AWS Server migration',
        filePath: dataSamplesPath + 'aws-server-v3.yaml',
        referenceFilePath: dataReferencesPath + 'aws-server-v3.json',
        environmentTitle: 'AWS Server Migration Service'
      },
      {
        desc: 'should import AWS Cloudfront',
        filePath: dataSamplesPath + 'aws-cloudfront-v3.yaml',
        referenceFilePath: dataReferencesPath + 'aws-cloudfront-v3.json',
        environmentTitle: 'Amazon CloudFront'
      },
      {
        desc: 'should import Custom schema',
        filePath: dataSamplesPath + 'custom-schema-v3.yaml',
        referenceFilePath: dataReferencesPath + 'custom-schema-v3.json',
        environmentTitle: 'Sample v3 schema'
      },
      {
        desc: 'should import Custom schema with no API prefix',
        filePath: dataSamplesPath + 'custom-schema-no-prefix-v3.yaml',
        referenceFilePath:
          dataReferencesPath + 'custom-schema-no-prefix-v3.json',
        environmentTitle: 'Sample v3 schema'
      }
    ]
  }
];

describe('Swagger/OpenAPI import', () => {
  testSuites.forEach((testSuite, suiteIndex) => {
    describe(testSuite.name, () => {
      testSuite.tests.forEach((testCase) => {
        it(testCase.desc, async () => {
          const filename = pathParse(testCase.filePath).name;

          if (suiteIndex === 0) {
            await browser.pause(1000);
          }

          await environments.localAddFromOpenApi();

          await dialogs.open(resolve(testCase.filePath));

          await environments.browseOpenApi();

          await dialogs.save(
            resolve(`./tmp/storage/import-result/${filename}.json`)
          );

          await environments.importOpenApi();

          await browser.pause(5000);

          await environments.assertActiveMenuEntryText(
            testCase.environmentTitle
          );

          await utils.waitForAutosave();

          const environmentFile = await readFile(
            resolve(`./tmp/storage/import-result/${filename}.json`)
          );
          const referenceEnvironmentFile = await readFile(
            resolve(testCase.referenceFilePath)
          );

          const environment: Environment = JSON.parse(
            environmentFile.toString()
          );
          const referenceEnvironment: Environment = JSON.parse(
            referenceEnvironmentFile.toString()
          );
          cleanEnv(environment);
          cleanEnv(referenceEnvironment);

          expect(environment).toEqual(referenceEnvironment);

          await environments.close(1);
        });
      });
    });
  });
});
