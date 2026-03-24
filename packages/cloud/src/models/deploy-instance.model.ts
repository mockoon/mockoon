export enum DeployRegions {
  US = 'us',
  CA = 'ca',
  EU = 'eu',
  ASIA = 'asia',
  AU = 'au',
  SA = 'sa'
}

export enum DeployInstanceStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED'
}

export enum DeployInstanceVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export type DeployInstance = {
  environmentUuid: string;
  subdomain: string;
  url: string;
  visibility: DeployInstanceVisibility;
  status: DeployInstanceStatus;
  name: string;
  apiKey: string;
  region: DeployRegions;
  // added in v9.6.0, indicates if the instance should be updated in real-time with environment changes using the admin API
  liveUpdate: boolean;
};
