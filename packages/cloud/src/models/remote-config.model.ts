export type Banner = {
  id: string;
  enabled: boolean;
  text: string;
  link: string;
  classes?: string;
  styles?: Record<string, string>;
  iconName?: string;
};

export type RemoteConfigData = {
  banner: Banner | null;
  enableTelemetry: boolean;
  geoipEndpoint: string;
  cloudSyncUrl?: string;
  deployUrl?: string;
};
