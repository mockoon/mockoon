export type ServerStateEventType = {
  uuid: string;
  running: boolean;
};

export type EnvironmentLog = {
  uuid: string;
  timestamp: Date;
  url: string;
  method: string;
  route: string;
  protocol: string;
  headers: { name: string, value: string }[];
  params: { name: string, value: string }[];
  queryParams: { name: string, value: string }[];
  body: string;
  proxied: boolean;
  response: EnvironmentLogResponse;
};

export type EnvironmentLogs = { [key: string]: EnvironmentLog[] };

export type EnvironmentLogNameValuePairs = { name: string, value: string }[];

export type EnvironmentLogResponse = {
  requestUUID: string;
  status: number;
  headers: { name: string, value: string }[];
  body: string;
};
