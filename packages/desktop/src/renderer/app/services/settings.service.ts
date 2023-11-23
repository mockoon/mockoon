import { Injectable } from '@angular/core';
import { Environment, IsEqual } from '@mockoon/commons';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  mergeMap,
  pairwise,
  tap
} from 'rxjs/operators';
import { gt as semverGt } from 'semver';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { SettingsSchema } from 'src/renderer/app/constants/settings-schema.constants';
import { PreMigrationSettings } from 'src/renderer/app/models/settings.model';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { updateSettingsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { FileWatcherOptions, Settings } from 'src/shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  public oldLastMigration: number;

  constructor(
    private store: Store,
    private storageService: StorageService,
    private telemetryService: TelemetryService,
    private uiService: UIService
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
        settings = validatedSchema.value;

        if (semverGt(Config.appVersion, settings.lastChangelog)) {
          this.uiService.openModal('changelog');

          this.updateSettings({ lastChangelog: Config.appVersion });
        }

        if (!settings.welcomeShown) {
          this.uiService.openModal('welcome');
        }
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
   * Get the current settings
   *
   * @returns
   */
  public getSettings() {
    return this.store.get('settings');
  }

  /**
   * Update the settings with new properties
   *
   * @param newProperties
   */
  public updateSettings(newProperties: Partial<Settings>) {
    this.store.update(updateSettingsAction(newProperties));
  }

  /**
   * Remove disabled routes from settings when they are not existing anymore
   *
   * @param environment
   */
  public cleanDisabledRoutes(environment: Environment) {
    const environmentUuid = environment.uuid;
    const routesUuids = environment.routes.map((route) => route.uuid);
    const disabledRoutes = { ...this.store.get('settings').disabledRoutes };

    if (disabledRoutes[environmentUuid]) {
      disabledRoutes[environmentUuid] = disabledRoutes[environmentUuid].filter(
        (routeUuid) => routesUuids.includes(routeUuid)
      );
    }

    this.updateSettings({ disabledRoutes });
  }

  /**
   * Remove collapsed folders from settings when they are not existing anymore
   *
   * @param environment
   */
  public cleanCollapsedFolders(environment: Environment) {
    const environmentUuid = environment.uuid;
    const foldersUuids = environment.folders.map((folder) => folder.uuid);
    const collapsedFolders = { ...this.store.get('settings').collapsedFolders };

    if (collapsedFolders[environmentUuid]) {
      collapsedFolders[environmentUuid] = collapsedFolders[
        environmentUuid
      ].filter((folderUuid) => foldersUuids.includes(folderUuid));
    }

    this.updateSettings({ collapsedFolders });
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
