import { DeployRegions } from './deploy-instance.model';

export type RemoteConfigData = {
  enableTelemetry: boolean;
  geoipEndpoint?: string;
  cloudSyncUrl?: string;
  deployUrl?: string;
  dataRefreshInterval?: number;
  regions?: { label: string; value: string }[];
  defaultRegion?: DeployRegions;
};
