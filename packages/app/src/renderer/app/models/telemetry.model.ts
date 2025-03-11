export type TelemetrySession = {
  installationId: string;
  startTime: string;
  endTime: string;
  firstSession: boolean;
  version: string;
  os: string;
  environmentsCount: number;
};
