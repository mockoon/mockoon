import { Header, Methods } from './route.model';

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
    urlPath: string | null;
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
  routeUUID: string;
  routeResponseUUID: string;
};
