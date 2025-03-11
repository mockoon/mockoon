import { Injectable } from '@angular/core';
import {
  Environment,
  IsEqual,
  ReorderAction,
  moveItemAtTarget
} from '@mockoon/commons';
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
import { SettingsSchema } from 'src/renderer/app/constants/settings-schema.constants';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { updateSettingsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import {
  EnvironmentsCategories,
  FileWatcherOptions,
  Settings
} from 'src/shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(
    private store: Store,
    private storageService: StorageService,
    private telemetryService: TelemetryService,
    private uiService: UIService,
    private mainApiService: MainApiService
  ) {}

  /**
   * Monitor some settings to trigger behaviors in the main process.
   * Store will emit null first, then the saved settings.
   */
  public monitorSettings() {
    // switch Faker locale
    return this.store.select('settings').pipe(
      pairwise(),
      tap(([previousSettings, currentSettings]) => {
        if (
          (!previousSettings && currentSettings) ||
          (previousSettings.fileWatcherEnabled !==
            currentSettings.fileWatcherEnabled &&
            currentSettings.fileWatcherEnabled === FileWatcherOptions.DISABLED)
        ) {
          this.mainApiService.invoke('APP_UNWATCH_ALL_FILE');
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
      tap((settings: Settings) => {
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
      distinctUntilChanged(IsEqual<Settings>),
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
      const newDisabledRoutes = disabledRoutes[environmentUuid].filter(
        (routeUuid) => routesUuids.includes(routeUuid)
      );

      if (disabledRoutes[environmentUuid].length !== newDisabledRoutes.length) {
        disabledRoutes[environmentUuid] = newDisabledRoutes;
        this.updateSettings({ disabledRoutes });
      }
    }
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
      const newCollapsedFolders = collapsedFolders[environmentUuid].filter(
        (folderUuid) => foldersUuids.includes(folderUuid)
      );

      if (
        collapsedFolders[environmentUuid].length !== newCollapsedFolders.length
      ) {
        collapsedFolders[environmentUuid] = newCollapsedFolders;
        this.updateSettings({ collapsedFolders });
      }
    }
  }

  /**
   * Reorganize environments categories
   *
   * @param reorderAction
   */
  public reorganizeEnvironmentsCategories(
    reorderAction: ReorderAction<string>
  ) {
    this.updateSettings({
      environmentsCategoriesOrder: moveItemAtTarget<EnvironmentsCategories>(
        this.store.get('settings').environmentsCategoriesOrder,
        reorderAction.reorderActionType,
        reorderAction.sourceId as string,
        reorderAction.targetId as string
      )
    });
  }
}
