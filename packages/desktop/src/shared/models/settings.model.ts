import { FakerAvailableLocales } from '@mockoon/commons';

export type EnvironmentDescriptor = { uuid: string; path: string };

export enum FileWatcherOptions {
  DISABLED = 'disabled',
  PROMPT = 'prompt',
  AUTO = 'auto'
}

export type Settings = {
  welcomeShown: boolean;
  bannerDismissed: string[];
  logSizeLimit: number;
  maxLogsPerEnvironment: number;
  truncateRouteName: boolean;
  mainMenuSize: number;
  secondaryMenuSize: number;
  fakerLocale: FakerAvailableLocales;
  fakerSeed: number;
  lastChangelog: string;
  environments: EnvironmentDescriptor[];
  enableTelemetry: boolean;
  storagePrettyPrint: boolean;
  fileWatcherEnabled: FileWatcherOptions;
  dialogWorkingDir: string;
  startEnvironmentsOnLoad: boolean;
};
