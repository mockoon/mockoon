import { Injectable } from '@angular/core';
import { get as storageGet, set as storageSet } from 'electron-json-storage';
import { debounceTime, filter } from 'rxjs/operators';
import { Logger } from 'src/app/classes/logger';
import { updateSettingsAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';

export type Settings = {
  welcomeShown: boolean;
  analytics: boolean;
  bannerDismissed: string[];
  logSizeLimit: number;
  truncateRouteName: boolean;
  routeMenuSize: number;
  envLogsSize: number;
};

export interface PreMigrationSettings extends Settings {
  lastMigration: number;
}

export type SettingsProperties = { [T in keyof Settings]?: Settings[T] };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  public oldLastMigration: number;
  private logger = new Logger('[SERVICE][SETTINGS]');

  private settingsSchema: Settings = {
    welcomeShown: false,
    analytics: true,
    bannerDismissed: [],
    logSizeLimit: 10000,
    truncateRouteName: true,
    routeMenuSize: undefined,
    envLogsSize: undefined
  };
  private storageKey = 'settings';

  constructor(private store: Store) {
    // get existing settings from storage or default one
    storageGet(this.storageKey, (error, settings: PreMigrationSettings) => {
      if (error) {
        this.logger.error(`Error while loading the settings: ${error.message}`);

        return;
      }

      // if empty object
      if (
        Object.keys(settings).length === 0 &&
        settings.constructor === Object
      ) {
        this.logger.info(`No Settings, building default settings`);

        // build default settings
        this.updateSettings(this.settingsSchema);
      } else {
        this.updateSettings({
          ...this.settingsSchema,
          ...this.migrateSettings(settings)
        });
      }
    });

    // save settings
    this.store
      .select('settings')
      .pipe(filter(Boolean), debounceTime(1000))
      .subscribe((settings: Settings) => {
        storageSet(this.storageKey, settings, (error) => {
          if (error) {
            this.logger.error(
              `Error while loading the settings: ${error.code} ${error.message}`
            );
          }
        });
      });
  }

  /**
   * Update the settings with new properties
   *
   * @param newProperties
   */
  public updateSettings(newProperties: SettingsProperties) {
    this.store.update(updateSettingsAction(newProperties));
  }

  /**
   * Handle the migration of some settings
   */
  private migrateSettings(settings: PreMigrationSettings): Settings {
    if (settings.lastMigration) {
      this.oldLastMigration = settings.lastMigration;
      delete settings.lastMigration;
    }

    return settings;
  }
}
