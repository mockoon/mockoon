import { Environment } from './environment.model';
import { FakerAvailableLocales } from './faker.model';
import { Cookie, Header, Methods } from './route.model';

export type ProcessedDatabucket = {
  id: string;
  name: string;
  value: any;
  parsed: boolean;
};

/**
 * Object containing invoked callback details.
 */
export type InvokedCallback = {
  name: string;
  url: string;
  method: keyof typeof Methods;
  requestHeaders: Header[];
  requestBody: any;
  status: number;
  responseBody: any;
  responseHeaders: Header[];
};

/**
 * Transaction object containing req/res information after response is closed
 */
export type Transaction = {
  request: {
    method: keyof typeof Methods;
    // url path without query string (e.g. /users/1)
    urlPath: string | null;
    fullUrl: string;
    proxyUrl?: string;
    // route path as defined in the environment (e.g. /users/:id)
    route: string | null;
    params: { name: string; value: string }[];
    query: string | null;
    queryParams: any;
    body: any;
    headers: Header[];
    httpVersion: string;
    mimeType?: string;
    cookies: Cookie[];
    startedAt: Date;
  };
  response: {
    statusCode: number;
    statusMessage: string;
    headers: Header[];
    body: string;
    cookies: Cookie[];
  };
  proxied: boolean;
  // environment's route UUID to which the transaction belongs
  routeUUID: string;
  // environment's route response UUID to which the transaction belongs
  routeResponseUUID: string;
  timestampMs: number;
};

export type ServerOptions = {
  /**
   * Directory where to find the environment file.
   */
  environmentDirectory?: string;

  /**
   * List of routes uuids to disable.
   * Can also accept strings containing a route partial path, e.g. 'users' will disable all routes containing 'users' in their path.
   */
  disabledRoutes?: string[];

  /**
   * Method used by the library to refresh the environment information
   */
  refreshEnvironmentFunction?: (environmentUUID: string) => Environment | null;

  /**
   * Faker options: seed and locale
   */
  fakerOptions?: {
    // Faker locale (e.g. 'en', 'en_GB', etc. For supported locales, see documentation.)
    locale?: FakerAvailableLocales;
    // Number for the Faker.js seed (e.g. 1234)
    seed?: number;
  };

  /**
   * Environment variables prefix
   */
  envVarsPrefix: string;

  /**
   * Enable the admin API
   * https://mockoon.com/docs/latest/admin-api/overview/
   */
  enableAdminApi: boolean;

  /**
   * Disable TLS
   */
  disableTls: boolean;

  /**
   * Maximum number of transaction logs to keep in memory for retrieval via the admin API
   * In the desktop app, equals to settings.maxLogsPerEnvironment
   * Can be configured when using serverless (same option) or CLI `--max-transaction-logs`
   */
  maxTransactionLogs: number;
};
