import { Injectable } from '@angular/core';
import { IsEqual } from '@mockoon/commons';
import { from, Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  pairwise,
  switchMap,
  tap
} from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { SettingsSchema } from 'src/renderer/app/constants/settings-schema.constants';
import {
  PreMigrationSettings,
  SettingsProperties
} from 'src/renderer/app/models/settings.model';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { updateSettingsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import {
  EnvironmentDescriptor,
  FileWatcherOptions
} from 'src/shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  public oldLastMigration: number;

  constructor(
    private store: Store,
    private storageService: StorageService,
    private telemetryService: TelemetryService
  ) {}

  /**
   * Monitor some settings to trigger behaviors in the main process
   */
  public monitorSettings() {
    // switch Faker locale
    return this.store.select('settings').pipe(
      filter((settings) => !!settings),
      pairwise(),
      tap(([previousSettings, currentSettings]) => {
        if (
          previousSettings.fakerLocale !== currentSettings.fakerLocale ||
          previousSettings.fakerSeed !== currentSettings.fakerSeed
        ) {
          MainAPI.send('APP_SET_FAKER_OPTIONS', {
            locale: currentSettings.fakerLocale,
            seed: currentSettings.fakerSeed
          });
        }

        if (
          previousSettings.fileWatcherEnabled !==
            currentSettings.fileWatcherEnabled &&
          currentSettings.fileWatcherEnabled === FileWatcherOptions.DISABLED
        ) {
          MainAPI.invoke('APP_UNWATCH_ALL_FILE');
        }
      })
    );
  }

  /**
   * Get existing settings from storage or create default one.
   * Start saving after loading the data.
   *
   * @returns
   */
  public loadSettings(): Observable<any> {
    return this.storageService.loadSettings().pipe(
      switchMap<
        PreMigrationSettings,
        Observable<{
          settings: PreMigrationSettings;
          environmentsList?: EnvironmentDescriptor[];
        }>
      >((settings) => {
        // if we don't have an environments object in the settings we need to migrate to the new system
        if (settings && !settings.environments) {
          return from(MainAPI.invoke('APP_NEW_STORAGE_MIGRATION')).pipe(
            map((environmentsList) => ({ environmentsList, settings }))
          );
        }

        return of({ settings });
      }),
      tap(
        (settingsData: {
          settings: PreMigrationSettings;
          environmentsList: EnvironmentDescriptor[];
        }) => {
          this.getOldSettings(settingsData.settings);

          if (!settingsData.settings) {
            this.telemetryService.setFirstSession();
          }

          const validatedSchema = SettingsSchema.validate(
            settingsData.settings
          );

          this.updateSettings(
            settingsData.environmentsList
              ? {
                  ...validatedSchema.value,
                  environments: settingsData.environmentsList
                }
              : validatedSchema.value
          );
        }
      )
    );
  }

  /**
   * Subscribe to initiate saving settings changes
   *
   * @returns
   */
  public saveSettings(): Observable<void> {
    return this.store.select('settings').pipe(
      filter((settings) => !!settings),
      debounceTime(500),
      distinctUntilChanged(IsEqual),
      tap(() => {
        this.storageService.initiateSaving();
      }),
      mergeMap((settings) =>
        this.storageService.saveSettings(settings, settings.storagePrettyPrint)
      )
    );
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
   * Retrieve old settings and store them temporarily
   *
   * @param settings
   */
  private getOldSettings(settings: PreMigrationSettings) {
    if (settings?.lastMigration) {
      this.oldLastMigration = settings.lastMigration;
    }
  }
}
