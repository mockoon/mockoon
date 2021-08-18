import { FakerAvailableLocales } from '@mockoon/commons';

export type EnvironmentDescriptor = { uuid: string; path: string };

export type Settings = {
  welcomeShown: boolean;
  analytics: boolean;
  bannerDismissed: string[];
  logSizeLimit: number;
  maxLogsPerEnvironment: number;
  truncateRouteName: boolean;
  environmentMenuSize: number;
  routeMenuSize: number;
  logsMenuSize: number;
  fakerLocale: FakerAvailableLocales;
  fakerSeed: number;
  lastChangelog: string;
  environments: EnvironmentDescriptor[];
  enableTelemetry: boolean;
  storagePrettyPrint: boolean;
};
