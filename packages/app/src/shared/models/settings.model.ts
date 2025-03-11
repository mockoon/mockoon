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

export type RecentLocalEnvironment = {
  name: string;
  path: string;
};

export type Settings = {
  welcomeShown: boolean;
  maxLogsPerEnvironment: number;
  truncateRouteName: boolean;
  mainMenuSize: number;
  secondaryMenuSize: number;
  fakerLocale: FakerAvailableLocales;
  fakerSeed: number;
  lastChangelog: string;
  environments: EnvironmentDescriptor[];
  disabledRoutes: Record<string, string[]>;
  collapsedFolders: Record<string, string[]>;
  enableTelemetry: boolean;
  storagePrettyPrint: boolean;
  fileWatcherEnabled: FileWatcherOptions;
  dialogWorkingDir: string;
  startEnvironmentsOnLoad: boolean;
  logTransactions: boolean;
  environmentsCategoriesOrder: EnvironmentsCategories[];
  environmentsCategoriesCollapsed: Record<EnvironmentsCategories, boolean>;
  envVarsPrefix: string;
  activeEnvironmentUuid: string | null;
  enableRandomLatency: boolean;
  recentLocalEnvironments: RecentLocalEnvironment[];
};
