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
  addRouteResponseMutator,
  getInsertAfterUuid,
  getRouteOrFolderInsertPosition
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

  it('should append route to root level when insertAfterUuid is undefined', () => {
    const env = createBaseEnvironment();
    const newRoute = {
      uuid: 'route-new',
      endpoint: 'first-route',
      method: 'get'
    } as Route;

    const result = addRouteMutator(env, newRoute, 'root');

    deepStrictEqual(result.rootChildren, [
      { type: 'route', uuid: 'route-1' },
      { type: 'folder', uuid: 'folder-1' },
      { type: 'route', uuid: 'route-2' },
      { type: 'route', uuid: 'route-new' }
    ]);
  });

  it('should insert route first when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newRoute = {
      uuid: 'route-new',
      endpoint: 'first-route',
      method: 'get'
    } as Route;

    const result = addRouteMutator(env, newRoute, 'root', null);

    strictEqual(result.rootChildren[0].uuid, 'route-new');
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

  it('should append route in folder when insertAfterUuid is undefined', () => {
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

    const result = addRouteMutator(env, newRoute, 'folder-1');

    deepStrictEqual(result.folders[0].children, [
      { type: 'route', uuid: 'child-1' },
      { type: 'route', uuid: 'child-2' },
      { type: 'route', uuid: 'child-new' }
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

  it('should append folder to root level when insertAfterUuid is undefined', () => {
    const env = createBaseEnvironment();
    const newFolder = {
      uuid: 'folder-new',
      name: 'First Folder',
      children: []
    } as Folder;

    const result = addFolderMutator(env, newFolder, 'root');

    deepStrictEqual(result.rootChildren, [
      { type: 'route', uuid: 'route-1' },
      { type: 'folder', uuid: 'folder-1' },
      { type: 'route', uuid: 'route-2' },
      { type: 'folder', uuid: 'folder-new' }
    ]);
  });

  it('should insert folder first when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newFolder = {
      uuid: 'folder-new',
      name: 'First Folder',
      children: []
    } as Folder;

    const result = addFolderMutator(env, newFolder, 'root', null);

    strictEqual(result.rootChildren[0].uuid, 'folder-new');
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

  it('should append folder in parent folder when insertAfterUuid is undefined', () => {
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

    const result = addFolderMutator(env, newFolder, 'folder-1');

    deepStrictEqual(result.folders[0].children, [
      { type: 'folder', uuid: 'subfolder-1' },
      { type: 'folder', uuid: 'subfolder-2' },
      { type: 'folder', uuid: 'subfolder-new' }
    ]);
  });
});

describe('environment-mutators: addDatabucketMutator with insertAfterUuid', () => {
  it('should insert databucket first when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newBucket = { uuid: 'data-new', name: 'First Data' } as DataBucket;

    const result = addDatabucketMutator(env, newBucket, null);

    strictEqual(result.data[0].uuid, 'data-new');
  });

  it('should append databucket when insertAfterUuid is undefined', () => {
    const env = createBaseEnvironment();
    const newBucket = { uuid: 'data-new', name: 'Appended Data' } as DataBucket;

    const result = addDatabucketMutator(env, newBucket);

    strictEqual(result.data[2].uuid, 'data-new');
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
  it('should insert callback first when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newCallback = { uuid: 'cb-new', name: 'First Callback' } as Callback;

    const result = addCallbackMutator(env, newCallback, null);

    strictEqual(result.callbacks[0].uuid, 'cb-new');
  });

  it('should append callback when insertAfterUuid is undefined', () => {
    const env = createBaseEnvironment();
    const newCallback = {
      uuid: 'cb-new',
      name: 'Appended Callback'
    } as Callback;

    const result = addCallbackMutator(env, newCallback);

    strictEqual(result.callbacks[2].uuid, 'cb-new');
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
  it('should insert route response first when insertAfterUuid is null', () => {
    const env = createBaseEnvironment();
    const newResponse = {
      uuid: 'res-new',
      statusCode: 201,
      label: 'Created'
    } as RouteResponse;

    const result = addRouteResponseMutator(env, 'route-1', newResponse, null);

    strictEqual(result.routes[0].responses[0].uuid, 'res-new');
  });

  it('should append route response when insertAfterUuid is undefined', () => {
    const env = createBaseEnvironment();
    const newResponse = {
      uuid: 'res-new',
      statusCode: 201,
      label: 'Created'
    } as RouteResponse;

    const result = addRouteResponseMutator(env, 'route-1', newResponse);

    strictEqual(result.routes[0].responses[2].uuid, 'res-new');
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

describe('mutator-utils: getRouteOrFolderInsertPosition and getInsertAfterUuid', () => {
  it('should return parentId root and null insertAfterUuid for item at index 0 in root', () => {
    const env = createBaseEnvironment();
    const pos = getRouteOrFolderInsertPosition(env, 'route-1');

    deepStrictEqual(pos, { parentId: 'root', insertAfterUuid: null });
  });

  it('should return parentId root and predecessor insertAfterUuid for item at index > 0 in root', () => {
    const env = createBaseEnvironment();
    const pos = getRouteOrFolderInsertPosition(env, 'folder-1');

    deepStrictEqual(pos, { parentId: 'root', insertAfterUuid: 'route-1' });
  });

  it('should return parent folder id and null insertAfterUuid for first child in folder', () => {
    const env = createBaseEnvironment();
    env.folders[0].children = [
      { type: 'route', uuid: 'child-1' },
      { type: 'route', uuid: 'child-2' }
    ];
    const pos = getRouteOrFolderInsertPosition(env, 'child-1');

    deepStrictEqual(pos, { parentId: 'folder-1', insertAfterUuid: null });
  });

  it('should return parent folder id and predecessor insertAfterUuid for subsequent child in folder', () => {
    const env = createBaseEnvironment();
    env.folders[0].children = [
      { type: 'route', uuid: 'child-1' },
      { type: 'route', uuid: 'child-2' }
    ];
    const pos = getRouteOrFolderInsertPosition(env, 'child-2');

    deepStrictEqual(pos, { parentId: 'folder-1', insertAfterUuid: 'child-1' });
  });

  it('should return null for item at index 0 in getInsertAfterUuid', () => {
    const items = [{ uuid: 'item-1' }, { uuid: 'item-2' }];

    strictEqual(getInsertAfterUuid(items, 'item-1'), null);
  });

  it('should return predecessor uuid for item at index > 0 in getInsertAfterUuid', () => {
    const items = [{ uuid: 'item-1' }, { uuid: 'item-2' }, { uuid: 'item-3' }];

    strictEqual(getInsertAfterUuid(items, 'item-2'), 'item-1');
    strictEqual(getInsertAfterUuid(items, 'item-3'), 'item-2');
  });

  it('should return undefined for non-existent item in getInsertAfterUuid', () => {
    const items = [{ uuid: 'item-1' }];

    strictEqual(getInsertAfterUuid(items, 'item-unknown'), undefined);
  });
});
