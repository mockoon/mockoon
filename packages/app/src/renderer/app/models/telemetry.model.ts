export type TelemetrySession = {
  installationId: string;
  startTime: string;
  endTime: string;
  firstSession: boolean;
  version: string;
  os: string;
  environmentsCount: number;
  app: 'web' | 'desktop';
  auth: boolean;
  paid: boolean;
};
