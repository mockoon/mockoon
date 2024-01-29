export type Banner = {
  id: string;
  enabled: boolean;
  text: string;
  link: string;
  classes?: string;
  styles?: { [key: string]: string };
  iconName?: string;
};

export type RemoteConfigData = {
  banner: Banner | null;
  enableTelemetry: boolean;
  geoipEndpoint: string;
};
