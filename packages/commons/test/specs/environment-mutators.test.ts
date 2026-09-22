import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import {
  Callback,
  DataBucket,
  Environment,
  Folder,
  Route,
  RouteResponse,
  addCallbackMutator,
  addDatabucketMutator,
  addFolderMutator,
  addRouteMutator,
  addRouteResponseMutator
} from '../../src';

const createBaseEnvironment = (): Environment =>
  ({
    uuid: 'env-1',
    name: 'Test Environment',
    port: 3000,
    endpointPrefix: '',
    latency: 0,
    routes: [
      {
        uuid: 'route-1',
        endpoint: 'users',
        method: 'get',
        responses: [
          { uuid: 'res-1', statusCode: 200, label: 'OK' } as RouteResponse,
          {
            uuid: 'res-2',
            statusCode: 404,
            label: 'Not Found'
          } as RouteResponse
        ]
      } as Route,
      {
        uuid: 'route-2',
        endpoint: 'posts',
        method: 'get',
        responses: []
      } as Route
    ],
    folders: [
      {
        uuid: 'folder-1',
        name: 'Folder 1',
        children: [{ type: 'route', uuid: 'route-3' }]
      } as Folder
    ],
    rootChildren: [
      { type: 'route', uuid: 'route-1' },
      { type: 'folder', uuid: 'folder-1' },
      { type: 'route', uuid: 'route-2' }
    ],
    data: [
      { uuid: 'data-1', name: 'Users' } as DataBucket,
      { uuid: 'data-2', name: 'Posts' } as DataBucket
    ],
    callbacks: [
      { uuid: 'cb-1', name: 'Callback 1' } as Callback,
      { uuid: 'cb-2', name: 'Callback 2' } as Callback
    ]
  }) as unknown as Environment;

describe('environment-mutators: addRouteMutator with insertAfterUuid', () => {
  it('should insert route after specified UUID in root level', () => {
    const env = createBaseEnvironment();
    const newRoute = {
      uuid: 'route-new',
      endpoint: 'comments',
      method: 'get'
    } as Route;

    const result = addRouteMutator(env, newRoute, 'root', 'route-1');

    deepStrictEqual(result.rootChildren, [
      { type: 'route', uuid: 'route-1' },
      { type: 'route', uuid: 'route-new' },
      { type: 'folder', uuid: 'folder-1' },
      { type: 'route', uuid: 'route-2' }
    ]);
    strictEqual(
      result.routes.some((r) => r.uuid === 'route-new'),
      true
    );
  });

  it('should insert route at index 0 in root level when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newRoute = {
      uuid: 'route-new',
      endpoint: 'first-route',
      method: 'get'
    } as Route;

    const result = addRouteMutator(env, newRoute, 'root', null);

    deepStrictEqual(result.rootChildren, [
      { type: 'route', uuid: 'route-new' },
      { type: 'route', uuid: 'route-1' },
      { type: 'folder', uuid: 'folder-1' },
      { type: 'route', uuid: 'route-2' }
    ]);
  });

  it('should append route to root level if insertAfterUuid not found', () => {
    const env = createBaseEnvironment();
    const newRoute = {
      uuid: 'route-new',
      endpoint: 'comments',
      method: 'get'
    } as Route;

    const result = addRouteMutator(env, newRoute, 'root', 'non-existent');

    deepStrictEqual(result.rootChildren, [
      { type: 'route', uuid: 'route-1' },
      { type: 'folder', uuid: 'folder-1' },
      { type: 'route', uuid: 'route-2' },
      { type: 'route', uuid: 'route-new' }
    ]);
  });

  it('should insert route after specified UUID in folder', () => {
    const env = createBaseEnvironment();
    env.folders[0].children = [
      { type: 'route', uuid: 'child-1' },
      { type: 'route', uuid: 'child-2' }
    ];
    const newRoute = {
      uuid: 'child-new',
      endpoint: 'folder-route',
      method: 'get'
    } as Route;

    const result = addRouteMutator(env, newRoute, 'folder-1', 'child-1');

    deepStrictEqual(result.folders[0].children, [
      { type: 'route', uuid: 'child-1' },
      { type: 'route', uuid: 'child-new' },
      { type: 'route', uuid: 'child-2' }
    ]);
  });

  it('should insert route at index 0 in folder when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    env.folders[0].children = [
      { type: 'route', uuid: 'child-1' },
      { type: 'route', uuid: 'child-2' }
    ];
    const newRoute = {
      uuid: 'child-new',
      endpoint: 'first-in-folder',
      method: 'get'
    } as Route;

    const result = addRouteMutator(env, newRoute, 'folder-1', null);

    deepStrictEqual(result.folders[0].children, [
      { type: 'route', uuid: 'child-new' },
      { type: 'route', uuid: 'child-1' },
      { type: 'route', uuid: 'child-2' }
    ]);
  });
});

describe('environment-mutators: addFolderMutator with insertAfterUuid', () => {
  it('should insert folder after specified UUID in root level', () => {
    const env = createBaseEnvironment();
    const newFolder = {
      uuid: 'folder-new',
      name: 'Folder New',
      children: []
    } as Folder;

    const result = addFolderMutator(env, newFolder, 'root', 'route-1');

    deepStrictEqual(result.rootChildren, [
      { type: 'route', uuid: 'route-1' },
      { type: 'folder', uuid: 'folder-new' },
      { type: 'folder', uuid: 'folder-1' },
      { type: 'route', uuid: 'route-2' }
    ]);
    strictEqual(
      result.folders.some((f) => f.uuid === 'folder-new'),
      true
    );
  });

  it('should insert folder at index 0 in root level when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newFolder = {
      uuid: 'folder-new',
      name: 'First Folder',
      children: []
    } as Folder;

    const result = addFolderMutator(env, newFolder, 'root', null);

    deepStrictEqual(result.rootChildren, [
      { type: 'folder', uuid: 'folder-new' },
      { type: 'route', uuid: 'route-1' },
      { type: 'folder', uuid: 'folder-1' },
      { type: 'route', uuid: 'route-2' }
    ]);
  });

  it('should insert folder after specified UUID in parent folder', () => {
    const env = createBaseEnvironment();
    env.folders[0].children = [
      { type: 'folder', uuid: 'subfolder-1' },
      { type: 'folder', uuid: 'subfolder-2' }
    ];
    const newFolder = {
      uuid: 'subfolder-new',
      name: 'Subfolder New',
      children: []
    } as Folder;

    const result = addFolderMutator(env, newFolder, 'folder-1', 'subfolder-1');

    deepStrictEqual(result.folders[0].children, [
      { type: 'folder', uuid: 'subfolder-1' },
      { type: 'folder', uuid: 'subfolder-new' },
      { type: 'folder', uuid: 'subfolder-2' }
    ]);
  });

  it('should insert folder at index 0 in parent folder when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    env.folders[0].children = [
      { type: 'folder', uuid: 'subfolder-1' },
      { type: 'folder', uuid: 'subfolder-2' }
    ];
    const newFolder = {
      uuid: 'subfolder-new',
      name: 'First Subfolder',
      children: []
    } as Folder;

    const result = addFolderMutator(env, newFolder, 'folder-1', null);

    deepStrictEqual(result.folders[0].children, [
      { type: 'folder', uuid: 'subfolder-new' },
      { type: 'folder', uuid: 'subfolder-1' },
      { type: 'folder', uuid: 'subfolder-2' }
    ]);
  });
});

describe('environment-mutators: addDatabucketMutator with insertAfterUuid', () => {
  it('should insert databucket at index 0 when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newBucket = { uuid: 'data-new', name: 'First Data' } as DataBucket;

    const result = addDatabucketMutator(env, newBucket, null);

    strictEqual(result.data[0].uuid, 'data-new');
    strictEqual(result.data.length, 3);
  });

  it('should insert databucket after specified UUID', () => {
    const env = createBaseEnvironment();
    const newBucket = { uuid: 'data-new', name: 'Middle Data' } as DataBucket;

    const result = addDatabucketMutator(env, newBucket, 'data-1');

    strictEqual(result.data[1].uuid, 'data-new');
    strictEqual(result.data.length, 3);
  });
});

describe('environment-mutators: addCallbackMutator with insertAfterUuid', () => {
  it('should insert callback at index 0 when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newCallback = { uuid: 'cb-new', name: 'First Callback' } as Callback;

    const result = addCallbackMutator(env, newCallback, null);

    strictEqual(result.callbacks[0].uuid, 'cb-new');
    strictEqual(result.callbacks.length, 3);
  });

  it('should insert callback after specified UUID', () => {
    const env = createBaseEnvironment();
    const newCallback = { uuid: 'cb-new', name: 'Middle Callback' } as Callback;

    const result = addCallbackMutator(env, newCallback, 'cb-1');

    strictEqual(result.callbacks[1].uuid, 'cb-new');
    strictEqual(result.callbacks.length, 3);
  });
});

describe('environment-mutators: addRouteResponseMutator with insertAfterUuid', () => {
  it('should insert route response at index 0 when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newResponse = {
      uuid: 'res-new',
      statusCode: 201,
      label: 'Created'
    } as RouteResponse;

    const result = addRouteResponseMutator(env, 'route-1', newResponse, null);

    strictEqual(result.routes[0].responses[0].uuid, 'res-new');
    strictEqual(result.routes[0].responses.length, 3);
  });

  it('should insert route response after specified UUID', () => {
    const env = createBaseEnvironment();
    const newResponse = {
      uuid: 'res-new',
      statusCode: 201,
      label: 'Created'
    } as RouteResponse;

    const result = addRouteResponseMutator(
      env,
      'route-1',
      newResponse,
      'res-1'
    );

    strictEqual(result.routes[0].responses[1].uuid, 'res-new');
    strictEqual(result.routes[0].responses.length, 3);
  });
});
