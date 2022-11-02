import { Environment } from './environment.model';
import { Header, Methods } from './route.model';

export interface MockoonServerOptions {
  environmentDirectory?: string;
  /**
   * Method used by the library to refresh the environment information
   */
  refreshEnvironmentFunction?: (environmentUUID: string) => Environment | null;

  /**
   * Allow passing a custom log provider
   */
  logProvider?: () => {
    log: (...args: any[]) => void;
    debug?: (...args: any[]) => void;
    info?: (...args: any[]) => void;
    warn?: (...args: any[]) => void;
    error?: (...args: any[]) => void;
  };
}

export type ProcessedDatabucket = {
  id: string;
  name: string;
  value: any;
  parsed: boolean;
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
