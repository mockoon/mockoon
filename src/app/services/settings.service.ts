import { Injectable } from '@angular/core';
import * as storage from 'electron-json-storage';
import { debounceTime, filter } from 'rxjs/operators';
import { updateSettingsAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';

export type Settings = {
  welcomeShown: boolean;
  analytics: boolean;
  bannerDismissed: string[];
  logSizeLimit: number;
  environmentsMenuState: boolean;
};

export type SettingsProperties = { [T in keyof Settings]?: Settings[T] };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  public oldLastMigration: number;

  private settingsSchema: Settings = {
    welcomeShown: false,
    analytics: true,
    bannerDismissed: [],
    logSizeLimit: 10000,
    environmentsMenuState: true
  };
  private storageKey = 'settings';

  constructor(private store: Store) {
    // get existing settings from storage or default one
    storage.get(this.storageKey, (error, settings) => {
      // if empty object
      if (
        Object.keys(settings).length === 0 &&
        settings.constructor === Object
      ) {
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
      .subscribe(settings => {
        storage.set(this.storageKey, settings);
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
  private migrateSettings(
    settings: Settings & { lastMigration: number }
  ): Settings {
    if (settings.lastMigration) {
      this.oldLastMigration = settings.lastMigration;
      delete settings.lastMigration;
    }

    return settings;
  }
}
