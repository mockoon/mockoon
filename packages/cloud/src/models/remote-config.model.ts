export type RemoteConfigData = {
  enableTelemetry: boolean;
  geoipEndpoint: string;
  cloudSyncUrl?: string;
  deployUrl?: string;
  dataRefreshInterval?: number;
};
