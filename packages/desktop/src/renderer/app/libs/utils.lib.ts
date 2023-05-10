import { Environment, Route, RouteType } from '@mockoon/commons';
import { EditorModes } from 'src/renderer/app/models/editor.model';

export const ArrayContainsObjectKey = (
  obj: { [key: string]: any },
  arr: string[]
) => {
  if (obj && arr) {
    return !!Object.keys(obj).find((key) => arr.includes(key));
  }

  return false;
};

/**
 * Retrieve the editor mode (Ace editor) from a content type
 *
 * @param contentType
 */
export const GetEditorModeFromContentType = (
  contentType: string
): EditorModes => {
  if (contentType.includes('application/json')) {
    return 'json';
  } else if (
    contentType.includes('text/html') ||
    contentType.includes('application/xhtml+xml')
  ) {
    return 'html';
  } else if (
    contentType.includes('application/xml') ||
    contentType.includes('text/xml') ||
    contentType.includes('application/soap+xml')
  ) {
    return 'xml';
  } else if (contentType.includes('text/css')) {
    return 'css';
  } else {
    return 'text';
  }
};

/**
 * Remove item from array by index
 *
 * @param items
 * @returns
 */
export const RemoveAtIndex = <T>(items: T[], index: number): T =>
  items.splice(index, 1)[0];

/**
 * Insert item in array at index
 *
 * @param items
 * @param index
 * @param item
 * @returns
 *
 */
export const InsertAtIndex = <T>(items: T[], index: number, item: T): T[] => {
  items.splice(index, 0, item);

  return items;
};

/**
 * Make a text human friendly
 *
 * @param text
 * @returns
 */
export const HumanizeText = (text: string): string => {
  text = text
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s{2,}/g, ' ');
  text = text.charAt(0).toUpperCase() + text.slice(1);

  return text;
};

/**
 * Build a full APi endpoint path with protocol, domain and port
 *
 * @param environment
 * @param route
 * @returns
 */
export const BuildFullPath = (environment: Environment, route: Route) => {
  let routeUrl =
    (environment.tlsOptions.enabled ? 'https://' : 'http://') +
    'localhost:' +
    environment.port +
    '/';

  if (environment.endpointPrefix) {
    routeUrl += environment.endpointPrefix + '/';
  }

  routeUrl += route.endpoint;

  return routeUrl;
};

/**
 * Check if two routes are duplicates, if:
 * - CRUD + same endpoint
 * - HTTP + same endpoint + same method
 *
 * @param routeA
 * @param routeB
 * @returns
 */
export const isRouteDuplicates = (
  routeA: Route | Pick<Route, 'type' | 'endpoint' | 'method'>,
  routeB: Route | Pick<Route, 'type' | 'endpoint' | 'method'>
): boolean =>
  (routeB.type === RouteType.CRUD &&
    routeA.type === RouteType.CRUD &&
    routeB.endpoint === routeA.endpoint) ||
  (routeB.type === RouteType.HTTP &&
    routeA.type === RouteType.HTTP &&
    routeB.endpoint === routeA.endpoint &&
    routeB.method === routeA.method);

/**
 * Check if an environment has a route that is a duplicate of the provided route
 *
 * @param environment
 * @param route
 * @param excludeRouteUUID
 * @returns
 */
export const environmentHasRoute = (
  environment: Environment,
  route: Route | Pick<Route, 'type' | 'endpoint' | 'method'>
): boolean =>
  environment.routes.some((envRoute) => isRouteDuplicates(envRoute, route));
