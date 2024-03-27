import { Environment } from '../models/environment.model';
import { Header, RouteResponse } from '../models/route.model';

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
) => {
  const routeResponseContentType = GetContentType(routeResponse.headers);
  const environmentContentType = GetContentType(environment.headers);

  return routeResponseContentType || environmentContentType || '';
};

export const GetResponseCallbackContentType = (
  environment: Environment,
  routeResponse: RouteResponse
) => {
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
    const myURL = new URL(address);

    return true;
  } catch (e) {
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
export const IsEqual = (firstObject: any, secondObject: any) =>
  JSON.stringify(firstObject) === JSON.stringify(secondObject);

export const RemoveLeadingSlash = (str: string) => str.replace(/^\//g, '');

export const GenerateUniqueID = () =>
  (Math.random() + 1).toString(36).substring(2, 6);

/**
 * Repair routes and folder references.
 * Remove references to non existing routes and folders.
 * Deduplicate references to the same route or folder.
 * Add references to orphan routes and folders at the root level.
 *
 * @param environment
 */
export const repairRefs = (environment: Environment) => {
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
export const generateUUID = () =>
  typeof window !== 'undefined'
    ? window.crypto.randomUUID()
    : require('crypto').randomUUID();

/**
 * Return a random integer
 *
 * @param a
 * @param b
 */
export const RandomInt = (a = 1, b = 0) => {
  const lower = Math.ceil(Math.min(a, b));
  const upper = Math.floor(Math.max(a, b));

  return Math.floor(lower + Math.random() * (upper - lower + 1));
};

export const randomArrayItem = <T>(array: T[]) =>
  array[RandomInt(0, array.length - 1)];

/**
 * Returns a deterministic stringified version of an object
 *
 * @param obj
 * @returns
 */
export const deterministicStringify = (obj: any) =>
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
