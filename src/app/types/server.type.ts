export type ServerStateEventType = {
  uuid: string;
  running: boolean;
};

export type EnvironmentLogType = {
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

export type EnvironmentLogsType = { [key: string]: EnvironmentLogType[] };

export type EnvironmentLogNameValuePairsType = { name: string, value: string }[];

export type EnvironmentLogResponse = {
  requestUuid: string;
  status: number;
  headers: { name: string, value: string }[];
  body: string;
};
