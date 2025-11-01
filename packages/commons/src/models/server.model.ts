import { FakerAvailableLocales } from './faker.model';
import { Header, Methods } from './route.model';

export type ProcessedDatabucket = {
  uuid: string;
  id: string;
  name: string;
  value: any;
  parsed: boolean;
  validJson: boolean;
};

export type ProcessedDatabucketWithoutValue = Omit<
  ProcessedDatabucket,
  'value'
>;

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
 * Represents an in-flight request.
 * WebSockets requests or any other long-living
 * connections can be considered as in-flight requests.
 */
export type InFlightRequest = {
  request: {
    method: keyof typeof Methods;
    urlPath: string | null;
    route: string | null;
    params?: { name: string; value: string }[];
    query?: string | null;
    queryParams?: any;
    body?: any;
    headers?: Header[];
  };
  completed?: boolean;
  status?: {
    code?: any;
    message?: string;
  };
  requestId: string;
  routeUUID: string;
};

/**
 * Transaction object containing req/res information after response is closed
 */
export type Transaction = {
  request: {
    method: keyof typeof Methods;
    // url path without query string (e.g. /users/1)
    urlPath: string | null;
    // route path as defined in the environment (e.g. /users/:id)
    route: string | null;
    params: { name: string; value: string }[];
    query: string | null;
    queryParams: any;
    body: any;
    headers: Header[];
  };
  response: {
    statusCode: number;
    statusMessage: string;
    headers: Header[];
    body: string;
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
   * Provide an absolute path to the environment file to avoid false positives when detecting path traversal.
   */
  environmentDirectory: string;

  /**
   * List of routes uuids to disable.
   * Can also accept strings containing a route partial path, e.g. 'users' will disable all routes containing 'users' in their path.
   */
  disabledRoutes?: string[];

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

  /**
   * Enable random latency from 0 to value specified in the route settings.                                                                                                 |
   */
  enableRandomLatency: boolean;

  /**
   * Max file upload number (multipart/form-data).
   * Set to 0 to disable file uploads. (busboy)
   */
  maxFileUploads?: number;

  /**
   * Max file upload size (multipart/form-data).
   */
  maxFileSize?: number;
};
