import { Environment, Environments } from '../models/environment.model';
import { LegacyExport } from '../models/export.model';
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
 * Verify if the object is a Mockoon legacy export data object
 *
 * @param data
 * @returns
 */
export const IsLegacyExportData = (
  data: Environment | LegacyExport
): data is LegacyExport =>
  (data as LegacyExport).source !== undefined &&
  (data as LegacyExport).source?.split(':')[0] === 'mockoon';

/**
 * Import legacy export Mockoon's format.
 * Data was wrapped and could enclose multiple environments (and routes):
 *
 * ```
 * {
 *   "source": "mockoon:1.17.0",
 *   "data": [
 *     {
 *       "type": "environment",
 *       "item": {
 *         "uuid": "",
 *         "lastMigration": 13,
 *         "name": "Tutorial - Generate mock data"
 *         ...
 *       }
 *     }
 *   ]
 * }
 *
 * ```
 */
export const UnwrapLegacyExport = (exportData: LegacyExport): Environments =>
  exportData.data.reduce<Environments>((environments, dataItem) => {
    if (dataItem.type === 'environment') {
      environments.push(dataItem.item);
    }

    return environments;
  }, []);

/**
 * Clone an object using JSON.stringify
 * /!\ Suitable for Environment, Route, etc but not for complex objects containing Map, Set, etc
 */
export const CloneObject = (objectToClone: any) =>
  JSON.parse(JSON.stringify(objectToClone));

/**
 * Compare two objects using JSON.Stringify
 */
export const IsEqual = (firstObject: any, secondObject: any) =>
  JSON.stringify(firstObject) === JSON.stringify(secondObject);

export const RemoveLeadingSlash = (str: string) => str.replace(/^\//g, '');

export const GenerateDatabucketID = () =>
  (Math.random() + 1).toString(36).substring(2, 6);
