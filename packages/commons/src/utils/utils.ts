import { match } from 'path-to-regexp';
import { ParsedJSONBodyMimeTypes } from '../constants/common.constants';
import { Environment } from '../models/environment.model';
import { Folder, FolderChild } from '../models/folder.model';
import { Header, Route, RouteResponse, RouteType } from '../models/route.model';

/**
 * Deduplicate slashes in a string
 *
 * @param str
 * @returns
 */
export const dedupSlashes = (str: string) => str.replace(/\/{2,}/g, '/');

/**
 * Extract the content-type from an array of headers
 *
 * @param headers
 */
export const GetContentType = (headers: Header[]): string | null => {
  const contentTypeHeader = headers.find(
    (header) => header.key.toLowerCase() === 'content-type'
  );

  if (contentTypeHeader) {
    return contentTypeHeader.value;
  }

  return null;
};

/**
 * Return a route response's content-type.
 * Environment's content-type is overridden by route's content-type
 *
 * @param environment
 * @param routeResponse
 */
export const GetRouteResponseContentType = (
  environment: Environment,
  routeResponse: RouteResponse
): string => {
  const routeResponseContentType = GetContentType(routeResponse.headers);
  const environmentContentType = GetContentType(environment.headers);

  return routeResponseContentType || environmentContentType || '';
};

export const GetResponseCallbackContentType = (
  environment: Environment,
  routeResponse: RouteResponse
): string => {
  const routeResponseContentType = GetContentType(routeResponse.headers);
  const environmentContentType = GetContentType(environment.headers);

  return routeResponseContentType || environmentContentType || '';
};

/**
 * Test if URL is valid
 *
 * @param URL
 */
export const IsValidURL = (address: string): boolean => {
  try {
    new URL(address);

    return true;
  } catch (_error) {
    return false;
  }
};

/**
 * Clone an object using JSON.stringify
 * /!\ Suitable for Environment, Route, etc but not for complex objects containing Map, Set, etc
 */
export const CloneObject = <T>(objectToClone: T): T =>
  JSON.parse(JSON.stringify(objectToClone));

/**
 * Compare two objects using JSON.Stringify
 */
export const IsEqual = <T = unknown>(
  firstObject: T,
  secondObject: T
): boolean => JSON.stringify(firstObject) === JSON.stringify(secondObject);

export const RemoveLeadingSlash = (str: string): string =>
  str.replace(/^\//g, '');

export const GenerateUniqueID = (): string =>
  (Math.random() + 1).toString(36).substring(2, 6);

/**
 * Repair routes and folder references.
 * Remove references to non existing routes and folders.
 * Deduplicate references to the same route or folder.
 * Add references to orphan routes and folders at the root level.
 *
 * @param environment
 */
export const repairRefs = (environment: Environment): Environment => {
  const routesUUIDs = environment.routes.reduce((set, route) => {
    set.add(route.uuid);

    return set;
  }, new Set<string>());
  const foldersUUIDs = environment.folders.reduce((set, folder) => {
    set.add(folder.uuid);

    return set;
  }, new Set<string>());

  // remove folders children that are not existing
  environment.folders.forEach((folder) => {
    folder.children = folder.children.filter((folderChild) => {
      if (folderChild.type === 'route') {
        const hasItem = routesUUIDs.has(folderChild.uuid);
        if (hasItem) {
          routesUUIDs.delete(folderChild.uuid);
        }

        return hasItem;
      } else {
        const hasItem = foldersUUIDs.has(folderChild.uuid);
        if (hasItem) {
          foldersUUIDs.delete(folderChild.uuid);
        }

        return hasItem;
      }
    });
  });

  // remove root level children the are not existing
  environment.rootChildren = environment.rootChildren.filter((rootChild) => {
    if (rootChild.type === 'route') {
      const hasItem = routesUUIDs.has(rootChild.uuid);
      if (hasItem) {
        routesUUIDs.delete(rootChild.uuid);
      }

      return hasItem;
    } else {
      const hasItem = foldersUUIDs.has(rootChild.uuid);
      if (hasItem) {
        foldersUUIDs.delete(rootChild.uuid);
      }

      return hasItem;
    }
  });

  // add orphan folders to the root level
  foldersUUIDs.forEach((folderUUID) => {
    environment.rootChildren.push({
      type: 'folder',
      uuid: folderUUID
    });
  });

  // add orphan routes to the root level
  routesUUIDs.forEach((routeUUID) => {
    environment.rootChildren.push({
      type: 'route',
      uuid: routeUUID
    });
  });

  return environment;
};

/**
 * browser randomUUID will be used when in a browser context (desktop app)
 * node randomUUID will be used when in a node context (CLI, serverless lib)
 *
 * @returns
 */
export const generateUUID = (): string =>
  typeof window !== 'undefined'
    ? window.crypto.randomUUID()
    : require('crypto').randomUUID();

/**
 * Return a random integer
 *
 * @param a
 * @param b
 */
export const RandomInt = (a = 1, b = 0): number => {
  const lower = Math.ceil(Math.min(a, b));
  const upper = Math.floor(Math.max(a, b));

  return Math.floor(lower + Math.random() * (upper - lower + 1));
};

export const randomArrayItem = <T>(array: T[]): T =>
  array[RandomInt(0, array.length - 1)];

/**
 * Returns a deterministic stringified version of an object
 *
 * @param obj
 * @returns
 */
export const deterministicStringify = (obj: unknown): string =>
  JSON.stringify(obj, (_key, value) =>
    value instanceof Object && !(value instanceof Array)
      ? Object.keys(value)
          .sort()
          .reduce((sorted, key) => {
            sorted[key] = value[key];

            return sorted;
          }, {})
      : value
  );

/**
 * Check that at least one item of the array is included in the provided string
 *
 * @param array
 * @param str
 * @returns
 */
export const stringIncludesArrayItems = (
  array: (string | RegExp)[],
  str: string
): boolean =>
  array.some((item) =>
    item instanceof RegExp ? item.test(str) : str.includes(item)
  );

/**
 * Verify if the request content type is application/json
 *
 * @param headers
 */
export const isContentTypeApplicationJson = (
  headers: Header[] | string
): boolean => {
  const contentType = Array.isArray(headers)
    ? GetContentType(headers)?.toLowerCase()
    : headers.toLowerCase();

  return contentType
    ? stringIncludesArrayItems(ParsedJSONBodyMimeTypes, contentType)
    : false;
};

/**
 * Get latency value (ms) depending on whether it should be randomized or not
 *
 * @param latency
 * @param enableRandomLatency
 */
export const getLatency = (
  latency: number,
  enableRandomLatency: boolean
): number => (enableRandomLatency ? RandomInt(0, latency) : latency);

/**
 * List routes in the order they appear in a folder children array (can be called recursively)
 *
 * If excludeList is provided, it will exclude the routes with the provided UUIDs,
 * or the routes in the provided folders by keyword in the folder name.
 * A wildcard '*' can be used to exclude all routes.
 *
 * If filterByType is provided, it will only return routes of the specified type.
 *
 * @param folderChildren - rootChildren object, or folder children array
 * @param allFolders - environment folders array
 * @param allRoutes - environment routes array
 * @param excludeList
 * @param filterByType
 * @returns
 */
export const routesFromFolder = (
  folderChildren: FolderChild[],
  allFolders: Folder[],
  allRoutes: Route[],
  excludeList: string[] = [],
  filterByType?: RouteType[]
): Route[] => {
  const routesList: Route[] = [];

  folderChildren.forEach((folderChild) => {
    if (folderChild.type === 'route') {
      const foundRoute = allRoutes.find(
        (route) =>
          route.uuid === folderChild.uuid &&
          (!filterByType || filterByType.includes(route.type)) &&
          !excludeList.includes(route.uuid) &&
          !excludeList.some((exclude) => route.endpoint.includes(exclude)) &&
          !excludeList.includes('*')
      );

      if (foundRoute) {
        routesList.push(foundRoute);
      }
    } else {
      const subFolder = allFolders.find(
        (folder) =>
          folder.uuid === folderChild.uuid &&
          !excludeList.some((exclude) => folder.name.includes(exclude)) &&
          !excludeList.includes('*')
      );

      if (subFolder) {
        routesList.push(
          ...routesFromFolder(
            subFolder.children,
            allFolders,
            allRoutes,
            excludeList
          )
        );
      }
    }
  });

  return routesList;
};

/**
 * Creates a set of CRUD routes for a given route path
 *
 * @param routePath
 * @returns
 */
export const crudRoutesBuilder = (routePath: string) => {
  const routes = [
    {
      id: 'get',
      docs: 'Get all items',
      method: 'get',
      path: dedupSlashes(`${routePath}`),
      defaultStatus: 200
    },
    {
      id: 'getbyId',
      docs: 'Get item by ID',
      method: 'get',
      path: dedupSlashes(`${routePath}/:id`),
      defaultStatus: 200
    },
    {
      id: 'create',
      docs: 'Create a new item',
      method: 'post',
      path: dedupSlashes(`${routePath}`),
      defaultStatus: 201
    },
    {
      id: 'update',
      docs: 'Update all items',
      method: 'put',
      path: dedupSlashes(`${routePath}`),
      defaultStatus: 200
    },
    {
      id: 'updateById',
      docs: 'Update item by ID',
      method: 'put',
      path: dedupSlashes(`${routePath}/:id`),
      defaultStatus: 200
    },
    {
      id: 'updateMerge',
      docs: 'Partially update all items',
      method: 'patch',
      path: dedupSlashes(`${routePath}`),
      defaultStatus: 200
    },
    {
      id: 'updateMergeById',
      docs: 'Partially update item by ID',
      method: 'patch',
      path: dedupSlashes(`${routePath}/:id`),
      defaultStatus: 200
    },
    {
      id: 'delete',
      docs: 'Delete all items',
      method: 'delete',
      path: dedupSlashes(`${routePath}`),
      defaultStatus: 200
    },
    {
      id: 'deleteById',
      docs: 'Delete item by ID',
      method: 'delete',
      path: dedupSlashes(`${routePath}/:id`),
      defaultStatus: 200
    }
  ] as const;

  return routes;
};

/**
 * Converts Express <=4 route syntax to a path-to-regexp v8 compatible syntax.
 *
 * This primarily addresses:
 * - unnamed wildcards (*) now requiring a name
 * - optional params using ? now requiring braces
 * - repeating params using +/* now requiring wildcard syntax
 * - optional literal characters/groups using ? now requiring braces
 * - parentheses grouping now using braces
 *
 * @param path
 * @returns
 */
export const express5PathConvert = (path: string): string => {
  let convertedPath = path;
  let wildcardIndex = 0;

  // Express 4: /test/* => path-to-regexp v8: /test/*wildcard0
  convertedPath = convertedPath.replace(
    /(^|\/)\*(?![A-Za-z0-9_"])/g,
    (_match, prefix: string) => `${prefix}*wildcard${wildcardIndex++}`
  );

  // /ab(cd)?e => /ab{cd}e (parentheses with optional, excluding escaped \()
  convertedPath = convertedPath.replace(
    /(?<!\\)\(([^)]+)\)\?/g,
    (_match, group: string) => `{${group}}`
  );

  // /ab(cd)e => /ab{cd}e (parentheses without optional, still need braces, excluding escaped \()
  convertedPath = convertedPath.replace(
    /(?<!\\)\(([^)]+)\)/g,
    (_match, group: string) => `{${group}}`
  );

  // /users/:id? => /users{/:id}
  // /file/:file.:ext? => /file/:file{.:ext}
  convertedPath = convertedPath.replace(
    /([/.~-]):([A-Za-z_$][A-Za-z0-9_$]*)\?/g,
    (_match, separator: string, parameterName: string) =>
      `{${separator}:${parameterName}}`
  );

  // /files/:path+ => /files/*path
  // Process parameter patterns BEFORE literal character patterns to avoid false matches
  convertedPath = convertedPath.replace(
    /:([A-Za-z_$][A-Za-z0-9_$]*)\+/g,
    (_match, parameterName: string) => `*${parameterName}`
  );

  // /files/:path* => /files{/*path}
  convertedPath = convertedPath.replace(
    /\/:([A-Za-z_$][A-Za-z0-9_$]*)\*/g,
    (_match, parameterName: string) => `{/*${parameterName}}`
  );

  // /ab?cd => /a{b}cd (optional literal character, excluding escaped)
  // After parameter patterns to avoid matching colons in params
  convertedPath = convertedPath.replace(
    /(?<!\\)([a-zA-Z0-9_])\?/g,
    (_match, char: string) => `{${char}}`
  );

  // /ab+cd => /ab{b}cd (one or more becomes optional for simplicity, excluding escaped)
  // Note: path-to-regexp v8 doesn't support "one or more" for literals
  // Converting to optional is a compromise - ideally update route definitions
  // After parameter patterns to avoid matching plus in :path+ patterns
  convertedPath = convertedPath.replace(
    /(?<!\\)([a-zA-Z0-9_])\+/g,
    (_match, char: string) => `${char}{${char}}`
  );

  return convertedPath;
};

/**
 * Prepare a path for express: add a leading slash, deduplicate slashes and replace spaces with %20
 *
 * @param endpointPrefix
 * @param endpoint
 * @returns
 */
export const preparePath = (endpointPrefix: string, endpoint: string) => {
  const preparedPath = dedupSlashes(
    `/${endpointPrefix}/${endpoint.replace(/ /g, '%20')}`
  );

  return {
    preparedPath: express5PathConvert(preparedPath),
    original: preparedPath
  };
};

/**
 * Path matching using path-to-regexp match function
 * @param path
 * @returns
 */
export const pathMatch = (path: string) => {
  return match(path);
};

export const pathMatchErrorBuilder = (error: unknown) => {
  if (error instanceof Error) {
    return {
      ...error,
      message: `Invalid route path: ${error.message.split(';')[0]}`
    };
  }

  return {
    name: 'Error',
    message: 'Invalid route path'
  };
};
