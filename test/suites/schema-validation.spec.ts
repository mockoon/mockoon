import { Environment, HighestMigrationId } from '@mockoon/commons';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { Config } from 'src/renderer/app/config';
import { Settings } from 'src/shared/models/settings.model';
import { Tests } from 'test/lib/tests';

describe('Schema validation', () => {
  describe('Unable to migrate, repair', () => {
    const tests = new Tests('schema-validation/broken');

    it('should fail migration and repair if too broken (route object missing)', async () => {
      await tests.helpers.checkToastDisplayed(
        'warning',
        'Migration of environment "Missing route object" failed. The environment was automatically repaired and migrated to the latest version.'
      );
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        [
          'lastMigration',
          // indirectly verify that it's an array
          'routes.0'
        ],
        [HighestMigrationId, undefined]
      );
    });
  });

  describe('Generic (test with Settings)', () => {
    const genericTestCases = [
      {
        path: 'schema-validation/empty-file',
        describeTitle: 'Empty file',
        testTitle: 'should fix empty file',
        preTest: async (fileContent) => {
          expect(() => {
            JSON.parse(fileContent);
          }).to.throw('Unexpected end of JSON input');
        }
      },
      {
        path: 'schema-validation/null-content',
        describeTitle: 'Null content',
        testTitle: 'should fix null content',
        preTest: async (fileContent) => {
          expect(JSON.parse(fileContent)).to.equal(null);
        }
      },
      {
        path: 'schema-validation/empty-object',
        describeTitle: 'Empty object',
        testTitle: 'should fix empty object',
        preTest: async (fileContent) => {
          expect(JSON.parse(fileContent)).to.be.an('object');
        }
      },
      {
        path: 'schema-validation/corrupted-content',
        describeTitle: 'Corrupted content',
        testTitle: 'should fix corrupted content',
        preTest: async (fileContent) => {
          expect(JSON.parse(fileContent)).to.be.an('object');
        }
      }
    ];

    genericTestCases.forEach((genericTestCase) => {
      describe(genericTestCase.describeTitle, () => {
        const tests = new Tests(genericTestCase.path, true, true, false);

        it(genericTestCase.testTitle, async () => {
          const fileContent = (
            await fs.readFile('./tmp/storage/settings.json')
          ).toString();

          genericTestCase.preTest(fileContent);

          await tests.helpers.waitForAutosave();

          await tests.helpers.verifyObjectPropertyInFile(
            './tmp/storage/settings.json',
            'welcomeShown',
            false
          );
        });
      });
    });
  });

  describe('Settings', () => {
    const tests = new Tests('schema-validation/settings', true, true, false);

    it('should verify initial properties (missing, invalid, unknown)', async () => {
      const fileContent: Settings = JSON.parse(
        (await fs.readFile('./tmp/storage/settings.json')).toString()
      );

      expect(fileContent.logsMenuSize).to.be.undefined;
      expect(fileContent.bannerDismissed).to.be.undefined;
      expect((fileContent as any).unknown).to.equal(true);
      expect(fileContent.environments).to.include.members([null, 'unknown']);
      expect(fileContent.environments[2]).to.include({
        uuid: '',
        path: '/home/username/file1.json'
      });
    });

    it('should verify saved properties (missing, invalid, unknown)', async () => {
      await tests.helpers.waitForAutosave();
      const fileContent: Settings = JSON.parse(
        (await fs.readFile('./tmp/storage/settings.json')).toString()
      );

      // add missing properties with default
      expect(fileContent.logsMenuSize).to.equal(150);
      expect(fileContent.bannerDismissed)
        .to.be.an('array')
        .that.have.lengthOf(0);

      // remove unknown values
      expect((fileContent as any).unknown).to.be.undefined;
      // remove invalid values
      expect(fileContent.environments).to.be.an('array').that.have.lengthOf(0);
    });
  });

  describe('Environments', () => {
    const tests = new Tests('schema-validation/environments');

    it('should verify initial properties (missing, invalid, unknown)', async () => {
      const fileContent: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/environment-0.json')).toString()
      );

      expect(fileContent.routes[0].uuid).to.equal('non-uuid');

      expect(fileContent.name).to.be.undefined;
      expect(fileContent.routes[0].responses[0].rulesOperator).to.equal(
        'DUMMY'
      );
      expect(fileContent.routes[0].enabled).to.equal(null);
      expect(fileContent.routes[0].responses[0].statusCode).to.equal(99);

      // allow empty body
      expect(fileContent.routes[0].responses[0].body).to.equal('');

      // allow enum in target
      expect(fileContent.routes[0].responses[0].rules[1].target).to.equal(
        'invalid'
      );

      // invalid array item
      expect(fileContent.routes[0].responses[0].headers)
        .to.be.an('array')
        .that.have.lengthOf(2);
      expect(
        (fileContent.routes[0].responses[0].headers[0] as any).unknown
      ).to.equal(true);
    });

    it('should verify saved properties (missing, invalid, unknown)', async () => {
      await tests.helpers.waitForAutosave();
      const fileContent: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/environment-0.json')).toString()
      );

      expect(fileContent.routes[0].uuid).to.be.a.uuid('v4');

      expect(fileContent.name).to.equal('New environment');
      expect(fileContent.routes[0].responses[0].rulesOperator).to.equal('OR');
      expect(fileContent.routes[0].enabled).to.equal(true);
      expect(fileContent.routes[0].responses[0].statusCode).to.equal(200);

      // allow empty body
      expect(fileContent.routes[0].responses[0].body).to.equal('');

      // allow enum in target
      expect(fileContent.routes[0].responses[0].rules[1].target).to.equal(
        'body'
      );

      // strip invalid array item
      expect(fileContent.routes[0].responses[0].headers)
        .to.be.an('array')
        .that.have.lengthOf(1);
      expect(fileContent.routes[0].responses[0].headers[0].key).to.equal(
        'Content-Type'
      );
    });
  });

  describe('Route', () => {
    const tests = new Tests(
      'schema-validation/broken-route',
      true,
      true,
      false
    );

    it('Should import the broken route and fix the schema', async () => {
      const fileContent = await fs.readFile(
        './test/data/schema-validation/broken-route/route-export-broken.json',
        'utf-8'
      );

      tests.app.electron.clipboard.writeText(
        fileContent.replace('##appVersion##', Config.appVersion)
      );

      tests.helpers.mockDialog('showSaveDialog', [
        resolve('./tmp/storage/new-environment.json')
      ]);
      tests.helpers.selectMenuEntry('IMPORT_CLIPBOARD');

      await tests.app.client.pause(500);

      await tests.helpers.countEnvironments(1);
      await tests.helpers.countRoutes(1);

      await tests.helpers.waitForAutosave();

      const envFileContent: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/new-environment.json')).toString()
      );

      // verify that properties exists
      expect(envFileContent.uuid).to.be.a.uuid('v4');
      expect(envFileContent.routes[0].uuid).to.be.a.uuid('v4');
      expect(envFileContent.routes[0].enabled).to.equal(true);
      expect(envFileContent.routes[0].responses[0].statusCode).to.equal(200);
    });
  });

  describe('UUID deduplication (environment)', () => {
    const tests = new Tests('schema-validation/uuid-dedup');
    const initialUUID = 'a93e9c88-62f9-40a7-be4f-9645e1988d8a';

    it('should deduplicate UUIDs at launch', async () => {
      await tests.helpers.waitForAutosave();

      const env0Content: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/environment-0.json')).toString()
      );
      const env1Content: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/environment-1.json')).toString()
      );

      expect(env0Content.uuid).to.equal(initialUUID);
      expect(env0Content.routes[0].uuid).to.not.equal(initialUUID);
      expect(env0Content.routes[0].uuid).to.be.a.uuid('v4');
      expect(env0Content.routes[0].responses[0].uuid).to.not.equal(initialUUID);
      expect(env0Content.routes[0].responses[0].uuid).to.be.a.uuid('v4');

      expect(env1Content.uuid).to.not.equal(initialUUID);
      expect(env1Content.uuid).to.be.a.uuid('v4');
      expect(env1Content.routes[0].uuid).to.not.equal(initialUUID);
      expect(env1Content.routes[0].uuid).to.be.a.uuid('v4');
      expect(env1Content.routes[0].responses[0].uuid).to.not.equal(initialUUID);
      expect(env1Content.routes[0].responses[0].uuid).to.be.a.uuid('v4');

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        ['environments.0.uuid', 'environments.1.uuid'],
        [initialUUID, env1Content.uuid]
      );
    });

    it('should deduplicate UUIDs when opening another environment', async () => {
      await fs.copyFile(
        './test/data/schema-validation/uuid-dedup/env-to-load.json',
        './tmp/storage/env-to-load.json'
      );
      tests.helpers.mockDialog('showOpenDialog', [
        resolve('./tmp/storage/env-to-load.json')
      ]);
      await tests.helpers.openEnvironment();
      await tests.app.client.pause(500);
      await tests.helpers.countEnvironments(3);
      await tests.helpers.assertHasActiveEnvironment('uuid dedup load');

      await tests.helpers.waitForAutosave();

      const envContent: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/env-to-load.json')).toString()
      );
      expect(envContent.uuid).to.not.equal(initialUUID);
      expect(envContent.uuid).to.be.a.uuid('v4');
      expect(envContent.routes[0].uuid).to.not.equal(initialUUID);
      expect(envContent.routes[0].uuid).to.be.a.uuid('v4');
      expect(envContent.routes[0].responses[0].uuid).to.not.equal(initialUUID);
      expect(envContent.routes[0].responses[0].uuid).to.be.a.uuid('v4');
    });

    it('should deduplicate UUIDs when importing another environment', async () => {
      tests.helpers.mockDialog('showOpenDialog', [
        './test/data/schema-validation/uuid-dedup/env-to-import.json'
      ]);
      tests.helpers.mockDialog('showSaveDialog', [
        resolve('./tmp/storage/env-to-import.json')
      ]);

      tests.helpers.selectMenuEntry('IMPORT_FILE');

      await tests.app.client.pause(500);

      await tests.helpers.countEnvironments(4);
      await tests.helpers.assertHasActiveEnvironment('uuid dedup import');

      await tests.helpers.waitForAutosave();

      const envContent: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/env-to-import.json')).toString()
      );
      expect(envContent.uuid).to.not.equal(initialUUID);
      expect(envContent.uuid).to.be.a.uuid('v4');
      expect(envContent.routes[0].uuid).to.not.equal(initialUUID);
      expect(envContent.routes[0].uuid).to.be.a.uuid('v4');
      expect(envContent.routes[0].responses[0].uuid).to.not.equal(initialUUID);
      expect(envContent.routes[0].responses[0].uuid).to.be.a.uuid('v4');
    });
  });

  describe('Mockoon format identifier', () => {
    const tests = new Tests(
      'schema-validation/missing-identifier',
      true,
      true,
      false
    );

    it('should prompt before opening an environment where identifier (lastmigration) is missing', async () => {
      await fs.copyFile(
        './test/data/schema-validation/missing-identifier/env-to-load.json',
        './tmp/storage/env-to-load.json'
      );
      tests.helpers.mockDialog('showOpenDialog', [
        resolve('./tmp/storage/env-to-load.json')
      ]);
      await tests.helpers.openEnvironment();

      await tests.app.client.waitUntilTextExists(
        '.modal-title',
        'Confirm file opening'
      );
    });

    it('should not open the file if cancel is clicked', async () => {
      await tests.helpers.elementClick('.modal-footer .btn:last-of-type');
      await tests.helpers.countEnvironments(0);
    });

    it('should open the file and fix the schema if confirm is clicked', async () => {
      tests.helpers.mockDialog('showOpenDialog', [
        resolve('./tmp/storage/env-to-load.json')
      ]);
      await tests.helpers.openEnvironment();

      await tests.app.client.waitUntilTextExists(
        '.modal-title',
        'Confirm file opening'
      );
      await tests.helpers.elementClick('.modal-footer .btn:first-of-type');
      await tests.helpers.countEnvironments(1);
      await tests.helpers.assertActiveEnvironmentName('missing identifier');

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/env-to-load.json',
        ['lastMigration'],
        [HighestMigrationId]
      );
    });
  });
});
