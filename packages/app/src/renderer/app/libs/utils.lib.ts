import { DeployInstance } from '@mockoon/cloud';
import {
  Environment,
  ParsedJSONBodyMimeTypes,
  Route,
  RouteType,
  stringIncludesArrayItems
} from '@mockoon/commons';
import { EditorModes } from 'src/renderer/app/models/editor.model';
import { Config } from 'src/renderer/config';
import { environment as env } from 'src/renderer/environments/environment';

export const ArrayContainsObjectKey = (
  obj: Record<string, any>,
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
  if (stringIncludesArrayItems(ParsedJSONBodyMimeTypes, contentType)) {
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
 * When developing the web app locally, we use .appdev tld as .app
 * requires HTTPS (due to HSTS mechanism)
 *
 * @param activeEnvironment
 * @param instance
 * @returns
 */
export const buildApiUrl = (
  activeEnvironment: Environment,
  instance?: DeployInstance
) => {
  let webUrl = instance?.url
    ? instance.url
    : `{subdomain}.mockoon.app${env.production ? '' : 'dev:5003'}`;

  // we do not display the protocol in the UI
  if (!env.production) {
    webUrl = webUrl.replace('http://', '');
  } else {
    webUrl = webUrl.replace('https://', '');
  }

  return `${
    Config.isWeb
      ? webUrl
      : activeEnvironment?.hostname || `localhost:${activeEnvironment?.port}`
  }`;
};

/**
 * Build a full API endpoint path with protocol, domain and port
 *
 * @param environment
 * @param route
 * @returns
 */
export const buildFullPath = (
  environment: Environment,
  route: Route,
  instance?: DeployInstance
) => {
  if (!environment || !route) {
    return '';
  }

  let protocol = 'http://';

  if (route.type === RouteType.WS) {
    if (environment?.tlsOptions.enabled || instance) {
      protocol = 'wss://';
    } else {
      protocol = 'ws://';
    }
  } else {
    if (environment?.tlsOptions.enabled || (instance && env.production)) {
      protocol = 'https://';
    }
  }

  let routeUrl = `${protocol}${buildApiUrl(environment, instance)}/`;

  if (environment?.endpointPrefix) {
    routeUrl += environment.endpointPrefix + '/';
  }

  // undo the regex escaping done in the route editor
  routeUrl += route.endpoint.replace(/\\\(/g, '(').replace(/\\\)/g, ')');

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

export const trackByUuid = (item: any) => item.uuid;
export const trackById = (item: any) => item.id;

/**
 * Check if a text contains all the words (separated by a space) in a search string
 *
 * @param text
 * @param search
 * @returns
 */
export const textFilter = (text: string, search: string) => {
  return search
    .split(' ')
    .filter((searchWord) => !!searchWord)
    .every(
      (searchWord) =>
        !!searchWord && text.toLowerCase().includes(searchWord.toLowerCase())
    );
};

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
