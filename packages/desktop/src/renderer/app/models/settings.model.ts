import { Settings } from 'src/shared/models/settings.model';

export interface PreMigrationSettings extends Settings {
  lastMigration: number;
}

export type SettingsProperties = { [T in keyof Settings]?: Settings[T] };
