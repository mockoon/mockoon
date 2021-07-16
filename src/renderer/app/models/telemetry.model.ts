export type TelemetrySession = {
  installationId: string;
  startTime: string;
  endTime: string;
  firstSession: boolean;
  country: string;
  version: string;
  os: string;
  environmentsCount: number;
};
