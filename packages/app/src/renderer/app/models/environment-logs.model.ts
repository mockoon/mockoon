import { Header, Methods } from '@mockoon/commons';

export type EnvironmentLogs = Record<string, EnvironmentLog[]>;

export type EnvironmentLogRequest = {
  headers: Header[];
  headersRaw?: Header[];
  params: { name: string; value: string }[];
  query: string;
  queryParams: { name: string; value: string }[];
  body: string;
  bodyUnformatted: string;
  isInvalidJson: boolean;
};

export type EnvironmentLogResponse = {
  status: number;
  statusMessage: string;
  headers: Header[];
  body: string;
  binaryBody: boolean;
  decompressed?: boolean;
  isInvalidJson: boolean;
};

export type EnvironmentLogOrigin = 'local' | 'cloud';

export type EnvironmentLog = {
  origin: EnvironmentLogOrigin;
  UUID: string;
  routeUUID: string;
  routeResponseUUID?: string;
  timestampMs: number;
  protocol: 'http' | 'ws';
  // full URL called
  url: string;
  // internal route matched
  route: string;
  method: keyof typeof Methods;
  proxied: boolean;
  request: EnvironmentLogRequest;
  response: EnvironmentLogResponse;
};

export type ActiveEnvironmentsLogUUIDs = Record<string, string>;
