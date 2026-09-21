import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import {
  Environment,
  Folder,
  Route,
  addFolderMutator,
  addRouteMutator
} from '../../src';

const createBaseEnvironment = (): Environment =>
  ({
    uuid: 'env-1',
    name: 'Test Environment',
    port: 3000,
    endpointPrefix: '',
    latency: 0,
    routes: [
      { uuid: 'route-1', endpoint: 'users', method: 'get' } as Route,
      { uuid: 'route-2', endpoint: 'posts', method: 'get' } as Route
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
    data: [],
    callbacks: []
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
});
