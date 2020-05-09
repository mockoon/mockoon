export type EnvironmentLogs = { [key: string]: EnvironmentLog[] };

export type EnvironmentLogRequest = {
  headers: { name: string; value: string }[];
  params: { name: string; value: string }[];
  queryParams: { name: string; value: string }[];
  body: string;
};

export type EnvironmentLogResponse = {
  status: number;
  headers: { name: string; value: string }[];
  body: string;
};

export type EnvironmentLog = {
  uuid: string;
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
