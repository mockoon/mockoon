import { FakerAvailableLocales } from 'src/app/models/faker.model';

export type Settings = {
  welcomeShown: boolean;
  analytics: boolean;
  bannerDismissed: string[];
  logSizeLimit: number;
  truncateRouteName: boolean;
  routeMenuSize: number;
  logsMenuSize: number;
  fakerLocale: FakerAvailableLocales;
  fakerSeed: number;
};

export interface PreMigrationSettings extends Settings {
  lastMigration: number;
}

export type SettingsProperties = { [T in keyof Settings]?: Settings[T] };
