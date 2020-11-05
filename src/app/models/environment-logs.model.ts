import { Header } from '@mockoon/commons';

export type EnvironmentLogs = { [key: string]: EnvironmentLog[] };

export type EnvironmentLogRequest = {
  headers: Header[];
  params: { name: string; value: string }[];
  queryParams: { name: string; value: string }[];
  body: string;
  truncatedBody?: string;
};

export type EnvironmentLogResponse = {
  status: number;
  headers: Header[];
  body: string;
  truncatedBody?: string;
  binaryBody: boolean;
};

export type EnvironmentLog = {
  UUID: string;
  routeUUID: string;
  routeResponseUUID: string;
  timestamp: Date;
  // full URL called
  url: string;
  // internal route matched
  route: string;
  method: string;
  proxied: boolean;
  request: EnvironmentLogRequest;
  response: EnvironmentLogResponse;
};

export type ActiveEnvironmentsLogUUIDs = {
  [key: string]: string;
};
