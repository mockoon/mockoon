export type ServerStateEventType = {
  uuid: string;
  running: boolean;
};

export type EnvironmentLogType = { timestamp: Date, route: string, request: any };
export type EnvironmentLogsType = { [key: string]: EnvironmentLogType[] };
