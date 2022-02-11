import { Injectable } from '@angular/core';
import { IsEqual } from '@mockoon/commons';
import { from, Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
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
  Settings
} from 'src/shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  public oldLastMigration: number;
  private storageKey = 'settings';

  constructor(
    private store: Store,
    private storageService: StorageService,
    private telemetryService: TelemetryService
  ) {
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
   * Get existing settings from storage or create default one.
   * Start saving after loading the data.
   *
   * @returns
   */
  public loadSettings(): Observable<any> {
    return this.storageService
      .loadData<PreMigrationSettings>(this.storageKey)
      .pipe(
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
      tap(() => {
        this.storageService.initiateSaving();
      }),
      debounceTime(500),
      distinctUntilChanged(IsEqual),
      mergeMap((settings) =>
        this.storageService.saveData<Settings>(
          settings,
          'settings',
          settings.storagePrettyPrint
        )
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
