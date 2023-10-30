import { Header, Methods } from './route.model';

export type ProcessedDatabucket = {
  id: string;
  name: string;
  value: any;
  parsed: boolean;
};

export type CallbackStatus = {
  uuid: string;
  method: string;
  uri: string;
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
  callbacks?: CallbackStatus[];
};
