export type ServerStateEventType = {
  uuid: string;
  running: boolean;
};

export type EnvironmentLogType = {
  timestamp: Date;
  url: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';
  route: string;
  protocol: string;
  headers: { name: string, value: string }[];
  params: { name: string, value: string }[];
  queryParams: { name: string, value: string }[];
  body: string;
  proxied: boolean;
  responseHeaders: { name: string, value: string }[];
  responseBody: string;
  responseStatusCode: string,
};

export type EnvironmentLogsType = { [key: string]: EnvironmentLogType[] };

export type EnvironmentLogNameValuePairsType = { name: string, value: string }[];
