import { Injectable } from '@angular/core';
import { distinctUntilChanged, filter, mergeMap, tap } from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { Config } from 'src/renderer/app/config';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import {
  PreMigrationSettings,
  Settings,
  SettingsProperties
} from 'src/renderer/app/models/settings.model';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { updateSettingsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  public oldLastMigration: number;
  private logger = new Logger('[SERVICE][SETTINGS]');

  private settingsSchema: Settings = {
    welcomeShown: false,
    analytics: true,
    bannerDismissed: [],
    logSizeLimit: 10000,
    maxLogsPerEnvironment: Config.defaultMaxLogsPerEnvironment,
    truncateRouteName: true,
    routeMenuSize: undefined,
    logsMenuSize: undefined,
    fakerLocale: 'en',
    fakerSeed: null,
    lastChangelog: null,
    enableTelemetry: true
  };
  private storageKey = 'settings';

  constructor(
    private store: Store,
    private storageService: StorageService,
    private telemetryService: TelemetryService
  ) {
    // get existing settings from storage or create default one. Start saving after loading the data
    this.storageService
      .loadData<PreMigrationSettings>(this.storageKey)
      .pipe(
        tap((settings) => {
          if (
            Object.keys(settings).length === 0 &&
            settings.constructor === Object
          ) {
            this.logger.info('No Settings, building default settings');

            this.telemetryService.setFirstSession();

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
        }),
        mergeMap(() =>
          this.storageService.saveData<Settings>(
            this.store.select('settings'),
            'settings',
            1000
          )
        )
      )
      .subscribe();

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
          MainAPI.send('APP_SET_FAKER_OPTIONS', {
            locale: settings.fakerLocale,
            seed: settings.fakerSeed
          });
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
