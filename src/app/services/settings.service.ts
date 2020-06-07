import { Injectable } from '@angular/core';
import { get as storageGet, set as storageSet } from 'electron-json-storage';
import * as faker from 'faker';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { Logger } from 'src/app/classes/logger';
import { Config } from 'src/app/config';
import { PreMigrationSettings, Settings, SettingsProperties } from 'src/app/models/settings.model';
import { updateSettingsAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';

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
    logsMenuSize: undefined,
    fakerLocale: 'en',
    fakerSeed: null,
    lastChangelog: null
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

        // build default settings (we do not need to show the changelog on a fresh install)
        this.updateSettings({
          ...this.settingsSchema,
          lastChangelog: Config.appVersion
        });
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

    // switch Faker locale
    this.store
      .select('settings')
      .pipe(
        filter((settings) => !!settings),
        distinctUntilChanged(
          (previous, current) =>
            previous.fakerLocale === current.fakerLocale &&
            previous.fakerSeed === current.fakerSeed
        ),
        tap((settings) => {
          // @ts-ignore
          faker.locale = settings.fakerLocale;
          faker.seed(settings.fakerSeed);
        })
      )
      .subscribe();
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
   * Handle the migration of some settings.
   * Adding new default settings is not needed and handled at
   * load time.
   */
  private migrateSettings(settings: PreMigrationSettings): Settings {
    // remove lastMigration from settings
    if (settings.lastMigration) {
      this.oldLastMigration = settings.lastMigration;
      delete settings.lastMigration;
    }

    return settings;
  }
}
