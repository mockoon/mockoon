
import { Injectable } from '@angular/core';
import * as storage from 'electron-json-storage';
import { debounceTime, filter } from 'rxjs/operators';
import { Store } from 'src/app/stores/store';

export type SettingsType = {
  welcomeShown: boolean;
  analytics: boolean;
  lastMigration: number;
  bannerDismissed: string[];
};

@Injectable()
export class SettingsService {
  private settingsSchema: SettingsType = {
    welcomeShown: false,
    analytics: true,
    lastMigration: 0,
    bannerDismissed: []
  };
  private storageKey = 'settings';

  constructor(private store: Store) {
    // get existing settings from storage or default one
    storage.get(this.storageKey, (error, settings) => {
      // if empty object
      if (Object.keys(settings).length === 0 && settings.constructor === Object) {
        // build default settings
        this.updateSettings(this.settingsSchema);
      } else {
        this.updateSettings({ ...this.settingsSchema, ...settings });
      }
    });

    // save settings
    this.store.select('settings').pipe(
      filter(Boolean),
      debounceTime(1000)
    ).subscribe((settings) => {
      storage.set(this.storageKey, settings);
    });
  }

  /**
   * Update the settings with new properties
   *
   * @param newProperties
   */
  public updateSettings(newProperties: Partial<SettingsType>) {
    this.store.update({ type: 'UPDATE_SETTINGS', properties: newProperties });
  }
}
