import { deepStrictEqual, notStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'node:test';
import {
  BodyTypes,
  Migrations,
  PostMigrationActions,
  ResponseMode,
  RouteDefault,
  RouteResponseDefault
} from '../../src';

const applyMigration = (migrationId: number, environment: any) => {
  const migrationFunction = Migrations.find(
    (migration) => migration.id === migrationId
  )?.migrationFunction;

  if (!migrationFunction) {
    throw new Error('Cannot find migration function');
  }

  return migrationFunction(environment);
};

describe('Migrations', () => {
  describe('migration n. 9', () => {
    it('should add "label" property to route responses', () => {
      const environment: any = {
        routes: [{ responses: [{}] }]
      };

      applyMigration(9, environment);

      notStrictEqual(environment.routes[0].responses[0].label, undefined);
    });
  });

  describe('migration n. 10', () => {
    it('should add "proxyReqHeaders" and "proxyResHeaders" headers properties to environments', () => {
      const environment: any = {};

      applyMigration(10, environment);

      notStrictEqual(environment.proxyReqHeaders, undefined);
      strictEqual(environment.proxyReqHeaders[0].key, '');
      notStrictEqual(environment.proxyResHeaders, undefined);
      strictEqual(environment.proxyResHeaders[0].key, '');
    });
  });

  describe('migration n. 11', () => {
    it('should add "disableTemplating" at false to route responses', () => {
      const environment: any = {
        routes: [{ responses: [{ statusCode: '200' }] }]
      };

      applyMigration(11, environment);

      strictEqual(environment.routes[0].responses[0].disableTemplating, false);
      strictEqual(environment.routes[0].responses[0].statusCode, 200);
    });
  });

  describe('migration n. 12', () => {
    it('should add "rulesOperator" at OR to route responses', () => {
      const environment: any = {
        routes: [{ responses: [{}] }]
      };

      applyMigration(12, environment);

      strictEqual(environment.routes[0].responses[0].rulesOperator, 'OR');
    });
  });

  describe('migration n. 13', () => {
    it('should add "randomResponse" to the route', () => {
      const environment: any = {
        routes: [{ responses: [{}] }]
      };

      applyMigration(13, environment);

      strictEqual(environment.routes[0].randomResponse, false);
    });
  });

  describe('migration n. 14', () => {
    it('should add "sequentialResponse" to the route', () => {
      const environment: any = {
        routes: [{ responses: [{}] }]
      };

      applyMigration(14, environment);

      strictEqual(environment.routes[0].sequentialResponse, false);
    });
  });

  describe('migration n. 15', () => {
    it('should add "proxyRemovePrefix" property to the environment', () => {
      const environment: any = {};

      applyMigration(15, environment);

      strictEqual(environment.proxyRemovePrefix, false);
    });
  });

  describe('migration n. 16', () => {
    it('should add "hostname" property to the environment', () => {
      const environment: any = {};

      applyMigration(16, environment);

      strictEqual(environment.hostname, '0.0.0.0');
    });
  });

  describe('migration n. 17', () => {
    it('should add "fallbackTo404" at false to route responses', () => {
      const environment: any = {
        routes: [{ responses: [{}] }]
      };

      applyMigration(17, environment);

      strictEqual(environment.routes[0].responses[0].fallbackTo404, false);
    });
  });

  describe('migration n. 18', () => {
    it('should remove `isRegex` from rules and `operator` property to "equals" by default or "regex" if `isRegex` was true', () => {
      const environment: any = {
        routes: [
          {
            responses: [
              {
                rules: [
                  {
                    target: 'body',
                    modifier: 'test',
                    value: 'test',
                    isRegex: false
                  },
                  {
                    target: 'body',
                    modifier: 'test',
                    value: 'test',
                    isRegex: true
                  }
                ]
              }
            ]
          }
        ]
      };

      applyMigration(18, environment);

      strictEqual(
        environment.routes[0].responses[0].rules[0].isRegex,
        undefined
      );
      strictEqual(
        environment.routes[0].responses[0].rules[0].operator,
        'equals'
      );
      strictEqual(
        environment.routes[0].responses[0].rules[1].isRegex,
        undefined
      );
      strictEqual(
        environment.routes[0].responses[0].rules[1].operator,
        'regex'
      );
    });
  });

  describe('migration n. 19', () => {
    it('should build a default tlsOptions object and remove the old https property', () => {
      const environment: any = {
        https: true
      };

      applyMigration(19, environment);

      strictEqual(environment.https, undefined);
      deepStrictEqual(environment.tlsOptions, {
        enabled: true,
        type: 'CERT',
        pfxPath: '',
        certPath: '',
        keyPath: '',
        caPath: '',
        passphrase: ''
      });
    });
  });

  describe('migration n. 20', () => {
    it('should add a `default` property to the route responses', () => {
      const environment = {
        routes: [{ responses: [{}, {}] }]
      };

      applyMigration(20, environment);

      strictEqual(environment.routes[0].responses[0]['default'], true);
      strictEqual(environment.routes[0].responses[1]['default'], false);
    });
  });

  describe('migration n. 21', () => {
    it('should add `responseMode` and remove `sequentialResponse` and `randomResponse`, initialized to null', () => {
      const environment = {
        routes: [{ sequentialResponse: false, randomResponse: false }]
      };

      applyMigration(21, environment);

      strictEqual(environment.routes[0]['responseMode'], null);
      strictEqual(environment.routes[0].sequentialResponse, undefined);
      strictEqual(environment.routes[0].randomResponse, undefined);
    });

    it('should add `responseMode` and remove `sequentialResponse` and `randomResponse`, initialized to SEQUENTIAL', () => {
      const environment = {
        routes: [{ sequentialResponse: true, randomResponse: false }]
      };

      applyMigration(21, environment);

      strictEqual(
        environment.routes[0]['responseMode'],
        ResponseMode.SEQUENTIAL
      );
      strictEqual(environment.routes[0].sequentialResponse, undefined);
      strictEqual(environment.routes[0].randomResponse, undefined);
    });

    it('should add `responseMode` and remove `sequentialResponse` and `randomResponse`, initialized to RANDOM', () => {
      const environment = {
        routes: [{ sequentialResponse: false, randomResponse: true }]
      };

      applyMigration(21, environment);

      strictEqual(environment.routes[0]['responseMode'], ResponseMode.RANDOM);
      strictEqual(environment.routes[0].sequentialResponse, undefined);
      strictEqual(environment.routes[0].randomResponse, undefined);
    });
  });

  describe('migration n. 22', () => {
    it('should add `invert` to the response rules', () => {
      const environment = {
        routes: [
          {
            responses: [
              {
                rules: [
                  {
                    target: 'body',
                    modifier: 'test',
                    value: 'test',
                    operator: 'equals'
                  }
                ]
              }
            ]
          }
        ]
      };

      applyMigration(22, environment);

      strictEqual(environment.routes[0].responses[0].rules[0]['invert'], false);
    });
  });

  describe('migration n. 23', () => {
    it('should add `data` to the environment', () => {
      const environment: any = {};

      applyMigration(23, environment);

      deepStrictEqual(environment.data, []);
    });
  });

  describe('migration n. 24', () => {
    it('should add `bodyType` and `databucketID` to the route responses and set it to INLINE by default or to FILE if a filepath was given', () => {
      const environment: any = {
        routes: [{ responses: [{ filePath: './file' }, { filePath: '' }] }]
      };

      applyMigration(24, environment);

      strictEqual(environment.routes[0].responses[0].bodyType, BodyTypes.FILE);
      strictEqual(
        environment.routes[0].responses[1].bodyType,
        BodyTypes.INLINE
      );
      strictEqual(environment.routes[0].responses[0].databucketID, '');
    });
  });

  describe('migration n. 25', () => {
    it('should add `folders` property to an environment', () => {
      const environment = { routes: [{ uuid: '1' }, { uuid: '2' }] };

      applyMigration(25, environment);

      deepStrictEqual(environment['folders'], []);

      deepStrictEqual(environment['rootChildren'], [
        { type: 'route', uuid: '1' },
        { type: 'route', uuid: '2' }
      ]);
    });
  });

  describe('migration n. 26', () => {
    it('should add `type` property to routes', () => {
      const environment = { routes: [{ uuid: '1' }, { uuid: '2' }] };

      applyMigration(26, environment);

      strictEqual(environment.routes[0]['type'], RouteDefault.type);
      strictEqual(environment.routes[1]['type'], RouteDefault.type);
    });
  });

  describe('migration n. 27', () => {
    it('should set hostname to null by default', () => {
      const environment1 = { hostname: '0.0.0.0' };
      const environment2 = { hostname: '127.0.0.1' };

      applyMigration(27, environment1);
      applyMigration(27, environment2);

      strictEqual(environment1.hostname, '');
      strictEqual(environment2.hostname, '127.0.0.1');
    });
  });

  describe('migration n. 28', () => {
    it('should provide a default crudKey property to it', () => {
      const environment: any = {
        routes: [{ responses: [{ filePath: './file' }, { filePath: '' }] }]
      };

      applyMigration(28, environment);

      strictEqual(
        environment.routes[0].responses[0].crudKey,
        RouteResponseDefault.crudKey
      );
      strictEqual(
        environment.routes[0].responses[1].crudKey,
        RouteResponseDefault.crudKey
      );
    });

    it('Dont set crudKey to id if already defined', () => {
      const environment: any = {
        routes: [
          {
            responses: [
              { crudKey: 'uuid', filePath: './file' },
              { crudKey: 'uuid', filePath: '' }
            ]
          }
        ]
      };

      applyMigration(28, environment);

      notStrictEqual(
        environment.routes[0].responses[0].crudKey,
        RouteResponseDefault.crudKey
      );
      notStrictEqual(
        environment.routes[0].responses[1].crudKey,
        RouteResponseDefault.crudKey
      );
      strictEqual(environment.routes[0].responses[0].crudKey, 'uuid');
      strictEqual(environment.routes[0].responses[1].crudKey, 'uuid');
    });
  });

  describe('migration n. 29', () => {
    it('Update faker functions in inline body to version 8', () => {
      const environment: any = {
        routes: [
          {
            responses: [
              {
                bodyType: 'INLINE',
                body: '{\n  "name": "{{{faker \'datatype.number\'}}}",\n  "name": "{{{faker \'name.firstName\'}}}"\n    "title": "{{{setVar \'x\' (faker \'name.prefix\' sex=\'male\')}}}"\n}'
              }
            ]
          }
        ]
      };
      applyMigration(29, environment);

      strictEqual(
        environment.routes[0].responses[0].body,
        '{\n  "name": "{{{faker \'number.int\' max=99999}}}",\n  "name": "{{{faker \'person.firstName\'}}}"\n    "title": "{{{setVar \'x\' (faker \'person.prefix\' sex=\'male\')}}}"\n}'
      );
    });

    it('Update faker functions in databucket to version 8', () => {
      const environment: any = {
        routes: [
          {
            responses: [
              {
                bodyType: 'DATABUCKET',
                databucketID: 's3km'
              }
            ]
          }
        ],
        data: [
          {
            uuid: '18d9dcec-5fc7-422d-98e8-4d9a7330b4f4',
            id: 's3km',
            name: 'bucket_1',
            documentation: '',
            value:
              '{\n  "name": "{{faker \'name.firstName\'}}"\n    "image": "{{faker \'image.abstract\' width=128 height=128}}"\n}'
          }
        ]
      };
      applyMigration(29, environment);

      strictEqual(
        environment.data[0].value,
        '{\n  "name": "{{faker \'person.firstName\'}}"\n    "image": "{{faker \'image.urlLoremFlickr\' width=128 height=128 category="abstract"}}"\n}'
      );
    });
  });

  describe('migration n. 30', () => {
    it('should have empty callbacks array by default', () => {
      const environment1: any = { routes: [{ responses: [{}] }] };
      const environment2: any = { callbacks: [] };

      applyMigration(30, environment1);
      applyMigration(30, environment2);

      notStrictEqual(environment1.callbacks, undefined);
      strictEqual(environment1.callbacks.length, 0);
      notStrictEqual(environment1.routes[0].responses[0].callbacks, undefined);
      strictEqual(environment1.routes[0].responses[0].callbacks.length, 0);
      strictEqual(environment2.callbacks.length, 0);
    });
  });

  describe('migration n. 31', () => {
    it('should remove route toggling and return the list of disabled route uuids', () => {
      const environment1: any = {
        uuid: 'a',
        routes: [
          { uuid: 'a1', enabled: true },
          { uuid: 'a2', enabled: true }
        ]
      };
      const environment2: any = {
        uuid: 'b',
        routes: [
          { uuid: 'b1', enabled: true },
          { uuid: 'b2', enabled: false }
        ]
      };
      const environment3: any = {
        uuid: 'c',
        routes: [
          { uuid: 'c1', enabled: false },
          { uuid: 'c2', enabled: false }
        ]
      };

      const postMigrationAction1 = applyMigration(31, environment1);
      const postMigrationAction2 = applyMigration(31, environment2);
      const postMigrationAction3 = applyMigration(31, environment3);

      strictEqual(environment1.routes[0].enabled, undefined);
      strictEqual(environment1.routes[1].enabled, undefined);
      strictEqual(environment2.routes[0].enabled, undefined);
      strictEqual(environment2.routes[1].enabled, undefined);
      strictEqual(environment3.routes[0].enabled, undefined);
      strictEqual(environment3.routes[1].enabled, undefined);

      deepStrictEqual(postMigrationAction1, {
        type: PostMigrationActions.DISABLED_ROUTES_MIGRATION,
        disabledRoutesUuids: []
      });
      deepStrictEqual(postMigrationAction2, {
        type: PostMigrationActions.DISABLED_ROUTES_MIGRATION,
        disabledRoutesUuids: ['b2']
      });
      deepStrictEqual(postMigrationAction3, {
        type: PostMigrationActions.DISABLED_ROUTES_MIGRATION,
        disabledRoutesUuids: ['c1', 'c2']
      });
    });
  });

  describe('migration n. 32', () => {
    it('should remove folder collapse and return the list of collapsed folders uuids', () => {
      const environment1: any = {
        uuid: 'a',
        folders: [
          { uuid: 'a1', collapsed: false },
          { uuid: 'a2', collapsed: false }
        ]
      };
      const environment2: any = {
        uuid: 'b',
        folders: [
          { uuid: 'b1', collapsed: false },
          { uuid: 'b2', collapsed: true }
        ]
      };
      const environment3: any = {
        uuid: 'c',
        folders: [
          { uuid: 'c1', collapsed: true },
          { uuid: 'c2', collapsed: true }
        ]
      };

      const postMigrationAction1 = applyMigration(32, environment1);
      const postMigrationAction2 = applyMigration(32, environment2);
      const postMigrationAction3 = applyMigration(32, environment3);

      strictEqual(environment1.folders[0].collapsed, undefined);
      strictEqual(environment1.folders[1].collapsed, undefined);
      strictEqual(environment2.folders[0].collapsed, undefined);
      strictEqual(environment2.folders[1].collapsed, undefined);
      strictEqual(environment3.folders[0].collapsed, undefined);
      strictEqual(environment3.folders[1].collapsed, undefined);

      deepStrictEqual(postMigrationAction1, {
        type: PostMigrationActions.COLLAPSED_FOLDERS_MIGRATION,
        collapsedFoldersUuids: []
      });
      deepStrictEqual(postMigrationAction2, {
        type: PostMigrationActions.COLLAPSED_FOLDERS_MIGRATION,
        collapsedFoldersUuids: ['b2']
      });
      deepStrictEqual(postMigrationAction3, {
        type: PostMigrationActions.COLLAPSED_FOLDERS_MIGRATION,
        collapsedFoldersUuids: ['c1', 'c2']
      });
    });
  });

  describe('migration n. 33', () => {
    it('should have set default websocket specifics to existing routes', () => {
      const environment0: any = {};
      const environment1: any = { routes: [{}] };
      const environment2: any = { routes: [{ uuid: 'abc' }, { uuid: 'abc2' }] };

      applyMigration(33, environment0);
      applyMigration(33, environment1);
      applyMigration(33, environment2);

      strictEqual(environment0.routes, undefined);
      notStrictEqual(environment1.routes[0], undefined);
      strictEqual(
        environment1.routes[0].streamingMode,
        RouteDefault.streamingMode
      );
      strictEqual(
        environment1.routes[0].streamingInterval,
        RouteDefault.streamingInterval
      );
      strictEqual(
        environment2.routes[0].streamingMode,
        RouteDefault.streamingMode
      );
      strictEqual(
        environment2.routes[0].streamingInterval,
        RouteDefault.streamingInterval
      );
      strictEqual(
        environment2.routes[1].streamingMode,
        RouteDefault.streamingMode
      );
      strictEqual(
        environment2.routes[1].streamingInterval,
        RouteDefault.streamingInterval
      );
    });
  });
});
