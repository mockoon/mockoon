import { DeployRegions } from './deploy-instance.model';

export type RemoteConfigData = {
  cloudSyncUrl?: string;
  deployUrl?: string;
  dataRefreshInterval?: number;
  regions?: { label: string; value: DeployRegions }[];
  defaultRegion?: DeployRegions;
};
