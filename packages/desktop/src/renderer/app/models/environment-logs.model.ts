import { Header, Methods } from '@mockoon/commons';

export type EnvironmentLogs = { [key: string]: EnvironmentLog[] };

export type EnvironmentLogRequest = {
  headers: Header[];
  params: { name: string; value: string }[];
  query: string;
  queryParams: { name: string; value: string }[];
  body: string;
  isInvalidJson: boolean;
};

export type EnvironmentLogResponse = {
  status: number;
  statusMessage: string;
  headers: Header[];
  body: string;
  binaryBody: boolean;
  unzipped?: boolean;
  isInvalidJson: boolean;
};

export type EnvironmentLog = {
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
  response?: EnvironmentLogResponse;
};

export type ActiveEnvironmentsLogUUIDs = {
  [key: string]: string;
};
