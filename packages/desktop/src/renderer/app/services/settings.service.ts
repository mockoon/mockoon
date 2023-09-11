import { Injectable } from '@angular/core';
import { IsEqual } from '@mockoon/commons';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  mergeMap,
  pairwise,
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
import { FileWatcherOptions } from 'src/shared/models/settings.model';

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
      tap((settings: PreMigrationSettings) => {
        this.getOldSettings(settings);

        if (!settings) {
          this.telemetryService.setFirstSession();
        }

        const validatedSchema = SettingsSchema.validate(settings);

        this.updateSettings(validatedSchema.value);
      })
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
