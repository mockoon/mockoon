import { Injectable } from '@angular/core';
import * as jsonStorage from 'electron-json-storage';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as storage from 'electron-json-storage';

export type SettingsType = {
  welcomeShown: boolean;
  analytics: boolean;
};

@Injectable()
export class SettingsService {
  public settings: SettingsType;
  public settingsReady: BehaviorSubject <boolean> = new BehaviorSubject <boolean>(false);

  public settingsUpdateEvents: Subject<{ settings: SettingsType, callback: Function }> = new Subject();

  private settingsSchema: SettingsType = {
    welcomeShown: false,
    analytics: true
  };
  private storageKey = 'settings';

  constructor() {
    // get existing settings from storage or default one
    storage.get(this.storageKey, (error, settings) => {
      // if empty object
      if (Object.keys(settings).length === 0 && settings.constructor === Object) {
        // build default settings
        this.settings = Object.assign({}, this.settingsSchema);
      } else {
        this.settings = settings;
      }

      this.settingsReady.next(true);
    });

    // subscribe to settings update
    this.settingsUpdateEvents.debounceTime(1000).subscribe((params) => {
      storage.set(this.storageKey, params.settings, () => {

        if (params.callback) {
          params.callback();
        }
      });
    });
  }
}
