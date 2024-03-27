import { FakerAvailableLocales } from '@mockoon/commons';

export type EnvironmentDescriptor = {
  uuid: string;
  path: string;
  // is it a cloud environment?
  cloud: boolean;
  // last hash seen on the server
  lastServerHash: string | null;
};

export enum FileWatcherOptions {
  DISABLED = 'disabled',
  PROMPT = 'prompt',
  AUTO = 'auto'
}

export type EnvironmentsCategories = 'cloud' | 'local';

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
  disabledRoutes: { [environmentUuid in string]: string[] };
  collapsedFolders: { [environmentUuid in string]: string[] };
  enableTelemetry: boolean;
  storagePrettyPrint: boolean;
  fileWatcherEnabled: FileWatcherOptions;
  dialogWorkingDir: string;
  startEnvironmentsOnLoad: boolean;
  logTransactions: boolean;
  environmentsCategoriesOrder: EnvironmentsCategories[];
  environmentsCategoriesCollapsed: {
    [key in EnvironmentsCategories]: boolean;
  };
  envVarsPrefix: string;
};
