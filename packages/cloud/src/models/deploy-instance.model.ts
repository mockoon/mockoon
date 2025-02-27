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
};
