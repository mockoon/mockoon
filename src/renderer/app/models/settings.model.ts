import { FakerAvailableLocales } from '@mockoon/commons';

export type Settings = {
  welcomeShown: boolean;
  analytics: boolean;
  bannerDismissed: string[];
  logSizeLimit: number;
  maxLogsPerEnvironment: number;
  truncateRouteName: boolean;
  routeMenuSize: number;
  logsMenuSize: number;
  fakerLocale: FakerAvailableLocales;
  fakerSeed: number;
  lastChangelog: string;
  enableTelemetry: boolean;
};

export interface PreMigrationSettings extends Settings {
  lastMigration: number;
}

export type SettingsProperties = { [T in keyof Settings]?: Settings[T] };
