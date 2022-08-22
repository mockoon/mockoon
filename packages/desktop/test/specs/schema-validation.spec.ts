import { Environment, HighestMigrationId } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { validate as validateUUID } from 'uuid';
import { Settings } from '../../src/shared/models/settings.model';
import clipboard from '../libs/clipboard';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import file from '../libs/file';
import menu from '../libs/menu';
import modals from '../libs/modals';
import routes from '../libs/routes';
import utils from '../libs/utils';

describe('Schema validation', () => {
  describe('Settings', () => {
    it('should prepare the broken settings', async () => {
      await file.editSettingsAndReload({
        welcomeShown: true,
        logSizeLimit: 10000,
        maxLogsPerEnvironment: 50,
        truncateRouteName: true,
        environmentMenuSize: 100,
        routeMenuSize: 200,
        fakerLocale: 'en',
        fakerSeed: null,
        lastChangelog: '9999.9.9',
        environments: [
          null,
          'unknown',
          { uuid: '', path: '/home/username/file1.json' }
        ],
        enableTelemetry: true,
        unknown: true
      } as unknown);
    });

    it('should verify saved properties (missing, invalid, unknown)', async () => {
      await utils.waitForAutosave();
      const fileContent: Settings = JSON.parse(
        (await fs.readFile('./tmp/storage/settings.json')).toString()
      );

      // add missing properties with default
      expect(fileContent.logsMenuSize).toEqual(150);
      expect(fileContent.bannerDismissed).toHaveLength(0);

      // remove unknown values
      expect((fileContent as any).unknown).toEqual(undefined);
      // remove invalid values
      expect(fileContent.environments).toHaveLength(0);
    });
  });

  describe('Unable to migrate, repair', () => {
    it('should open the environment', async () => {
      await environments.open('schema-broken-repair');
    });

    it('should fail migration and repair if too broken (route object missing)', async () => {
      await utils.checkToastDisplayed(
        'warning',
        'Migration of environment "Missing route object" failed. The environment was automatically repaired and migrated to the latest version.'
      );
      await utils.waitForAutosave();

      await file.verifyObjectPropertyInFile(
        './tmp/storage/schema-broken-repair.json',
        [
          'lastMigration',
          // indirectly verify that it's an array
          'routes.0'
        ],
        [HighestMigrationId, undefined]
      );
      await environments.close(1);
    });
  });

  describe('Environments', () => {
    it('should verify initial properties (missing, invalid, unknown)', async () => {
      const fileContent: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/schema-broken.json')).toString()
      );

      expect(fileContent.routes[0].uuid).toEqual('non-uuid');

      expect(fileContent.name).toEqual(undefined);
      expect(fileContent.routes[0].responses[0].rulesOperator).toEqual('DUMMY');
      expect(fileContent.routes[0].enabled).toEqual(null);
      expect(fileContent.routes[0].responses[0].statusCode).toEqual(99);

      // allow empty body
      expect(fileContent.routes[0].responses[0].body).toEqual('');

      // allow enum in target
      expect(fileContent.routes[0].responses[0].rules[1].target).toEqual(
        'invalid'
      );

      // invalid array item
      expect(fileContent.routes[0].responses[0].headers).toHaveLength(2);
      expect(
        (fileContent.routes[0].responses[0].headers[0] as any).unknown
      ).toEqual(true);
    });

    it('should open the environment', async () => {
      await environments.open('schema-broken');
    });

    it('should verify saved properties (missing, invalid, unknown)', async () => {
      await utils.waitForAutosave();
      const fileContent: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/schema-broken.json')).toString()
      );

      expect(validateUUID(fileContent.routes[0].uuid)).toEqual(true);

      expect(fileContent.name).toEqual('New environment');
      expect(fileContent.routes[0].responses[0].rulesOperator).toEqual('OR');
      expect(fileContent.routes[0].enabled).toEqual(true);
      expect(fileContent.routes[0].responses[0].statusCode).toEqual(200);

      // allow empty body
      expect(fileContent.routes[0].responses[0].body).toEqual('');

      // allow enum in target
      expect(fileContent.routes[0].responses[0].rules[1].target).toEqual(
        'body'
      );

      // strip invalid array item
      expect(fileContent.routes[0].responses[0].headers).toHaveLength(1);
      expect(fileContent.routes[0].responses[0].headers[0].key).toEqual(
        'Content-Type'
      );

      await environments.close(1);
    });
  });

  describe('Route', () => {
    it('should import the broken route and fix the schema', async () => {
      const fileContent = await fs.readFile(
        './test/data/res/schema-validation/route-broken.json',
        'utf-8'
      );

      await clipboard.write(fileContent);
      await dialogs.save(
        resolve('./tmp/storage/new-environment-route-broken.json')
      );
      await menu.click('MENU_NEW_ROUTE_CLIPBOARD');
      await browser.pause(500);

      await environments.assertCount(1);
      await routes.assertCount(1);

      await utils.waitForAutosave();

      const envFileContent: Environment = JSON.parse(
        (
          await fs.readFile('./tmp/storage/new-environment-route-broken.json')
        ).toString()
      );

      // verify that properties exists
      expect(validateUUID(envFileContent.uuid)).toEqual(true);
      expect(validateUUID(envFileContent.routes[0].uuid)).toEqual(true);
      expect(envFileContent.routes[0].enabled).toEqual(true);
      expect(envFileContent.routes[0].responses[0].statusCode).toEqual(200);
    });
  });

  describe('UUID deduplication (environment)', () => {
    const initialUUID = 'a93e9c88-62f9-40a7-be4f-9645e1988d8a';

    it('should prepare the settings', async () => {
      await file.editSettingsAndReload({
        environments: [
          {
            uuid: 'a93e9c88-62f9-40a7-be4f-9645e1988d8a',
            path: resolve('./tmp/storage/schema-uuid-dedup-1.json')
          },
          {
            uuid: 'a93e9c88-62f9-40a7-be4f-9645e1988d8a',
            path: resolve('./tmp/storage/schema-uuid-dedup-2.json')
          }
        ]
      });
    });

    it('should deduplicate UUIDs at launch', async () => {
      await utils.waitForAutosave();

      const env0Content: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/schema-uuid-dedup-1.json')).toString()
      );
      const env1Content: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/schema-uuid-dedup-2.json')).toString()
      );

      expect(env0Content.uuid).toEqual(initialUUID);

      expect(env0Content.data[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(env0Content.data[0].uuid)).toEqual(true);

      expect(env0Content.routes[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(env0Content.routes[0].uuid)).toEqual(true);

      expect(env0Content.routes[0].responses[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(env0Content.routes[0].responses[0].uuid)).toEqual(
        true
      );

      expect(env1Content.uuid).not.toEqual(initialUUID);
      expect(validateUUID(env1Content.uuid)).toEqual(true);

      expect(env1Content.data[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(env1Content.data[0].uuid)).toEqual(true);

      expect(env1Content.routes[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(env1Content.routes[0].uuid)).toEqual(true);

      expect(env1Content.routes[0].responses[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(env1Content.routes[0].responses[0].uuid)).toEqual(
        true
      );

      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        ['environments.0.uuid', 'environments.1.uuid'],
        [initialUUID, env1Content.uuid]
      );
    });

    it('should deduplicate UUIDs when opening another environment', async () => {
      await environments.open('schema-uuid-dedup-3');
      await environments.assertCount(3);
      await environments.assertActiveMenuEntryText('uuid dedup load');

      await utils.waitForAutosave();

      const envContent: Environment = JSON.parse(
        (await fs.readFile('./tmp/storage/schema-uuid-dedup-3.json')).toString()
      );

      expect(envContent.uuid).not.toEqual(initialUUID);
      expect(validateUUID(envContent.uuid)).toEqual(true);

      expect(envContent.data[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(envContent.data[0].uuid)).toEqual(true);

      expect(envContent.routes[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(envContent.routes[0].uuid)).toEqual(true);

      expect(envContent.routes[0].responses[0].uuid).not.toEqual(initialUUID);
      expect(validateUUID(envContent.routes[0].responses[0].uuid)).toEqual(
        true
      );

      await environments.close(1);
      await environments.close(1);
      await environments.close(1);
    });
  });

  describe('Missing mockoon format identifier', () => {
    it('should prompt before opening an environment where identifier (lastmigration) is missing', async () => {
      await fs.copyFile(
        './test/data/res/schema-validation/missing-identifier.json',
        './tmp/storage/missing-identifier.json'
      );
      await environments.open('missing-identifier', false);

      await modals.assertTitle('Confirm opening');
    });

    it('should not open the file if cancel is clicked', async () => {
      await $('.modal-footer .btn:last-of-type').click();
      await environments.assertCount(0);
    });

    it('should open the file and fix the schema if confirm is clicked', async () => {
      await environments.open('missing-identifier', false);

      await modals.assertTitle('Confirm opening');
      await $('.modal-footer .btn:first-of-type').click();
      await environments.assertCount(1);
      await environments.assertActiveMenuEntryText('missing identifier');

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/missing-identifier.json',
        ['lastMigration'],
        [HighestMigrationId]
      );
    });
  });
});
