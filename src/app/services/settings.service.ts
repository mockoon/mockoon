
import { Injectable } from '@angular/core';
import * as storage from 'electron-json-storage';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime } from 'rxjs/operators';

export type SettingsType = {
  welcomeShown: boolean;
  analytics: boolean;
  lastMigration: number;
};

@Injectable()
export class SettingsService {
  public settings: SettingsType;
  public settingsReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public settingsUpdateEvents: Subject<SettingsType> = new Subject();

  private settingsSchema: SettingsType = {
    welcomeShown: false,
    analytics: true,
    lastMigration: 0
  };
  private storageKey = 'settings';

  constructor() {
    // subscribe to settings update
    this.settingsUpdateEvents.pipe(debounceTime(1000)).subscribe((settings) => {
      storage.set(this.storageKey, settings, () => { });
    });

    // get existing settings from storage or default one
    storage.get(this.storageKey, (error, settings) => {
      // if empty object
      if (Object.keys(settings).length === 0 && settings.constructor === Object) {
        // build default settings
        this.settings = Object.assign({}, this.settingsSchema);
      } else {
        // add missing option
        if (settings.lastMigration === undefined) {
          settings.lastMigration = 0;

          this.settingsUpdateEvents.next(settings);
        }

        this.settings = settings;
      }

      this.settingsReady.next(true);
    });
  }
}
