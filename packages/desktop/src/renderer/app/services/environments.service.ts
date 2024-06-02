import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  EnvironmentsListPayload,
  getEnvironmentByteSize
} from '@mockoon/cloud';
import {
  BuildCRUDRoute,
  BuildCallback,
  BuildDatabucket,
  BuildDemoEnvironment,
  BuildEnvironment,
  BuildFolder,
  BuildHTTPRoute,
  BuildHeader,
  BuildRouteResponse,
  Callback,
  CloneCallback,
  CloneDataBucket,
  CloneObject,
  CloneRouteResponse,
  DataBucket,
  Environment,
  EnvironmentDefault,
  Folder,
  Header,
  HighestMigrationId,
  ReorderAction,
  ReorderableContainers,
  Route,
  RouteDefault,
  RouteResponse,
  RouteResponseDefault,
  RouteSchema,
  RouteType,
  deterministicStringify,
  generateUUID
} from '@mockoon/commons';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  concat,
  forkJoin,
  from,
  of,
  throwError,
  zip
} from 'rxjs';
import {
  catchError,
  debounceTime,
  filter,
  first,
  map,
  mergeMap,
  pairwise,
  startWith,
  switchMap,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import {
  HumanizeText,
  environmentHasRoute
} from 'src/renderer/app/libs/utils.lib';
import {
  CallbackResponseUsage,
  CallbackSpecTabNameType,
  CallbackTabsNameType,
  CallbackUsage
} from 'src/renderer/app/models/callback.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { MessageCodes } from 'src/renderer/app/models/messages.model';
import {
  EnvironmentLogsTabsNameType,
  TabsNameType,
  ViewsNameType
} from 'src/renderer/app/models/store.model';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { ServerService } from 'src/renderer/app/services/server.service';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import {
  Actions,
  addCallbackAction,
  addDatabucketAction,
  addEnvironmentAction,
  addFolderAction,
  addRouteAction,
  addRouteResponseAction,
  convertEnvironmentToLocalAction,
  duplicateCallbackToAnotherEnvironmentAction,
  duplicateDatabucketToAnotherEnvironmentAction,
  duplicateRouteToAnotherEnvironmentAction,
  logRequestAction,
  navigateEnvironmentsAction,
  refreshEnvironmentAction,
  reloadEnvironmentAction,
  removeCallbackAction,
  removeDatabucketAction,
  removeEnvironmentAction,
  removeFolderAction,
  removeRouteAction,
  removeRouteResponseAction,
  reorderCallbacksAction,
  reorderDatabucketsAction,
  reorderEnvironmentsAction,
  reorderRouteResponsesAction,
  reorderRoutesAction,
  setActiveCallbackAction,
  setActiveDatabucketAction,
  setActiveEnvironmentAction,
  setActiveEnvironmentLogTabAction,
  setActiveEnvironmentLogUUIDAction,
  setActiveRouteAction,
  setActiveRouteResponseAction,
  setActiveTabAction,
  setActiveTabInCallbackViewAction,
  setActiveViewAction,
  startEntityDuplicationToAnotherEnvironmentAction,
  updateCallbackAction,
  updateDatabucketAction,
  updateEnvironmentAction,
  updateEnvironmentStatusAction,
  updateFolderAction,
  updateRouteAction,
  updateRouteResponseAction,
  updateSettingsAction,
  updateUIStateAction
} from 'src/renderer/app/stores/actions';
import { ReducerDirectionType } from 'src/renderer/app/stores/reducer';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { EnvironmentDescriptor } from 'src/shared/models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentsService extends Logger {
  private environmentChangesNotified = false;
  private environmentChanges$ = new BehaviorSubject<
    {
      UUID: string;
      environmentPath: string;
      name: string;
    }[]
  >([]);

  constructor(
    private dataService: DataService,
    private eventsService: EventsService,
    private store: Store,
    private serverService: ServerService,
    private uiService: UIService,
    private storageService: StorageService,
    private dialogsService: DialogsService,
    protected toastService: ToastsService,
    private http: HttpClient
  ) {
    super('[RENDERER][SERVICE][ENVIRONMENTS] ', toastService);
  }

  /**
   * Load environments after waiting for the settings to load
   *
   * @returns
   */
  public loadEnvironments() {
    return forkJoin([
      this.store.select('settings').pipe(
        filter((settings) => !!settings),
        first()
      ),
      from(MainAPI.invoke('APP_BUILD_STORAGE_FILEPATH', 'demo'))
    ]).pipe(
      switchMap(([settings, demoFilePath]) => {
        if (!settings.environments.length && !settings.welcomeShown) {
          this.logMessage('info', 'FIRST_LOAD_DEMO_ENVIRONMENT');

          const defaultEnvironment = BuildDemoEnvironment();

          return of({
            settings,
            environmentsData: [
              {
                environment: defaultEnvironment,
                environmentDescriptor: {
                  uuid: defaultEnvironment.uuid,
                  path: demoFilePath,
                  cloud: false,
                  lastServerHash: null
                } as EnvironmentDescriptor
              }
            ]
          });
        }

        return forkJoin(
          settings.environments.map((environmentDescriptor) =>
            this.storageService
              .loadEnvironment(environmentDescriptor.path)
              .pipe(
                map((environment) =>
                  environment
                    ? {
                        environment,
                        environmentDescriptor
                      }
                    : null
                )
              )
          )
        ).pipe(map((environmentsData) => ({ settings, environmentsData })));
      }),
      // filter empty environments (file not found) and environments migrated with more recent app version
      map(({ settings, environmentsData }) => ({
        settings,
        environmentsData: environmentsData.filter(
          (environmentData) =>
            !!environmentData &&
            environmentData.environment.lastMigration <= HighestMigrationId
        )
      })),
      tap(({ settings, environmentsData }) => {
        environmentsData.forEach((environmentData) => {
          environmentData.environment =
            this.dataService.migrateAndValidateEnvironment(
              environmentData.environment
            );

          this.store.update(
            addEnvironmentAction(environmentData.environment, {
              setActive: false
            })
          );
        });

        const activeEnvironmentUuid =
          settings.activeEnvironmentUuid ??
          environmentsData[0]?.environment.uuid;

        if (
          activeEnvironmentUuid &&
          activeEnvironmentUuid !== settings.activeEnvironmentUuid
        ) {
          this.store.update(setActiveEnvironmentAction(activeEnvironmentUuid));
        }

        this.store.update(
          updateSettingsAction({
            environments: environmentsData.map((environmentData) => ({
              ...environmentData.environmentDescriptor,
              // update the environment UUID if it changed during migration/UUIDdeduplication
              uuid: environmentData.environment.uuid
            }))
          })
        );

        if (settings.startEnvironmentsOnLoad) {
          this.toggleAllEnvironments();
        }
      })
    );
  }

  /**
   * Subscribe to initiate saving environments changes.
   * Listen to environments and settings updates, and save environments in each path defined in the settings.
   * Will unwatch files for external change before saving, and rewatch after save is complete
   *
   * @returns
   */
  public saveEnvironments(): Observable<void> {
    return this.store.select('environments').pipe(
      tap(() => {
        // saving flag must be turned on before the debounceTime, otherwise waiting for save to end before closing won't work
        this.storageService.initiateSaving();
      }),
      debounceTime(Config.storageSaveDelay),
      startWith([]),
      // keep previously emitted environments and filter environments that didn't change (pairwise + map)
      pairwise(),
      map(([previousEnvironments, nextEnvironments]) =>
        nextEnvironments.filter(
          (nextEnvironment) =>
            nextEnvironment !==
            previousEnvironments.find(
              (previousEnvironment) =>
                previousEnvironment.uuid === nextEnvironment.uuid
            )
        )
      ),
      tap((modifiedEnvironments) => {
        MainAPI.send('APP_UPDATE_ENVIRONMENT', modifiedEnvironments);
      }),
      withLatestFrom(
        this.store.select('settings').pipe(filter((settings) => !!settings))
      ),
      mergeMap(([environments, settings]) =>
        from(environments).pipe(
          map((environment) => ({
            data: environment,
            descriptor: settings.environments.find(
              (environmentItem) => environmentItem.uuid === environment.uuid
            )
          })),
          filter(
            (environmentInfo) => environmentInfo.descriptor?.path !== undefined
          ),
          mergeMap((environmentInfo) =>
            this.storageService.saveEnvironment(
              environmentInfo.data,
              environmentInfo.descriptor,
              settings.storagePrettyPrint
            )
          )
        )
      )
    );
  }

  /**
   * Ask for confirmation before reloading an environment that was changed externally
   *
   * @param UUID
   * @param environmentPath
   * @returns
   */
  public notifyExternalChange(UUID: string, environmentPath: string) {
    const existingChange = this.environmentChanges$.value.find(
      (environmentChange) => environmentChange.UUID === UUID
    );

    if (!existingChange) {
      this.environmentChanges$.next([
        ...this.environmentChanges$.value,
        {
          UUID,
          environmentPath,
          name: this.store
            .get('environments')
            .find((environment) => environment.uuid === UUID)?.name
        }
      ]);
    }

    // ensure we open the modal only once
    if (!this.environmentChangesNotified) {
      this.environmentChangesNotified = true;

      return this.uiService
        .showConfirmDialog({
          title: 'External changes detected',
          text: 'The following environments were modified outside Mockoon:',
          sub: 'You can disable file monitoring in the application settings (Ctrl + Comma)',
          confirmButtonText: 'Reload all',
          cancelButtonText: 'Ignore',
          subIcon: 'info',
          list$: this.environmentChanges$.pipe(
            map((environmentChanges) =>
              environmentChanges.map(
                (environmentChange) => environmentChange.name
              )
            )
          )
        })
        .pipe(
          switchMap((confirmed) => {
            this.environmentChangesNotified = false;

            if (confirmed) {
              const obs = this.environmentChanges$.value.map(
                (environmentChange) =>
                  this.reloadEnvironment(
                    environmentChange.UUID,
                    environmentChange.environmentPath
                  )
              );

              this.environmentChanges$.next([]);

              return concat(...obs);
            }

            this.environmentChanges$.next([]);

            return EMPTY;
          })
        );
    }

    return EMPTY;
  }

  /**
   * Reload an environment into the store when an external change is detected
   *
   * @param previousUUID
   * @param environmentPath
   */
  public reloadEnvironment(previousUUID: string, environmentPath: string) {
    const environmentStatus = this.store.getEnvironmentStatus(previousUUID);

    if (environmentStatus.running) {
      this.serverService.stop(previousUUID);
    }

    return this.storageService.loadEnvironment(environmentPath).pipe(
      tap((newEnvironment) => {
        // if environment UUID changed, unwatch
        if (newEnvironment.uuid !== previousUUID) {
          MainAPI.invoke('APP_UNWATCH_FILE', previousUUID);
        }

        this.store.update(
          reloadEnvironmentAction(previousUUID, newEnvironment)
        );

        if (environmentStatus.running) {
          this.serverService.start(newEnvironment, environmentPath);
        }
      })
    );
  }

  /**
   * Set active environment by UUID or navigation
   */
  public setActiveEnvironment(
    environmentUUIDOrDirection: string | ReducerDirectionType
  ) {
    if (
      this.store.get('activeEnvironmentUUID') !== environmentUUIDOrDirection
    ) {
      if (
        environmentUUIDOrDirection === 'next' ||
        environmentUUIDOrDirection === 'previous'
      ) {
        this.store.update(
          navigateEnvironmentsAction(environmentUUIDOrDirection)
        );
      } else {
        this.store.update(
          setActiveEnvironmentAction(environmentUUIDOrDirection)
        );
      }
    }
  }

  /**
   * Set active route by UUID
   */
  public setActiveRoute(routeUUID: string) {
    const activeRouteUUID = this.store.get('activeRouteUUID');

    if (activeRouteUUID !== routeUUID) {
      this.store.update(setActiveRouteAction(routeUUID));
    }
  }

  /**
   * Add a new default environment, or the one provided, and save it in the store
   *
   * if promptSave is false, the environment will be added without asking for a save path, using the environment uuid as filename. But the environment object needs to be provided
   */
  public addEnvironment(
    options?: {
      environment?: Environment;
      insertAfterIndex?: number;
      promptSave?: boolean;
      cloud?: boolean;
      setActive?: boolean;
    },
    storeUpdateOptions = { force: false, emit: true }
  ) {
    options = {
      ...{
        environment: null,
        insertAfterIndex: null,
        promptSave: true,
        cloud: false,
        setActive: false
      },
      ...options
    };

    let filePath$: Observable<string>;

    if (options.promptSave) {
      filePath$ = this.dialogsService.showSaveDialog(
        'Save your new environment'
      );
    } else if (!options.promptSave && options.environment) {
      filePath$ = from(
        MainAPI.invoke('APP_BUILD_STORAGE_FILEPATH', options.environment.uuid)
      );
    }

    return filePath$.pipe(
      switchMap((filePath) => {
        if (!filePath) {
          return EMPTY;
        }

        if (
          this.store
            .get('settings')
            .environments.find(
              (environmentItem) => environmentItem.path === filePath
            ) !== undefined
        ) {
          return throwError(() => 'ENVIRONMENT_FILE_IN_USE');
        }

        return zip(
          of(filePath),
          from(MainAPI.invoke('APP_GET_FILENAME', filePath))
        );
      }),
      switchMap(([filePath, filename]) => {
        const newEnvironment = options.environment
          ? options.environment
          : BuildEnvironment({
              hasDefaultHeader: true,
              hasDefaultRoute: true,
              port: this.dataService.getNewEnvironmentPort()
            });

        // if a non-default name has been set already (imports), do not use the filename
        if (newEnvironment.name === EnvironmentDefault.name) {
          newEnvironment.name = HumanizeText(filename);
        }

        let observable: Observable<string | null> = of(null);

        if (options.cloud) {
          observable = from(
            MainAPI.invoke(
              'APP_GET_HASH',
              deterministicStringify(newEnvironment)
            )
          );
        }

        return observable.pipe(
          map((hash) => {
            return { newEnvironment, filePath, hash };
          })
        );
      }),
      tap(({ newEnvironment, filePath, hash }) => {
        this.store.update(
          addEnvironmentAction(newEnvironment, {
            filePath,
            insertAfterIndex: options.insertAfterIndex,
            cloud: options.cloud,
            setActive: options.setActive,
            hash
          }),
          storeUpdateOptions.force,
          storeUpdateOptions.emit
        );
      }),
      catchError((errorCode) => {
        this.logMessage('error', errorCode as MessageCodes);

        return EMPTY;
      })
    );
  }

  /**
   * Add and save a new environment from the clipboard
   */
  public newEnvironmentFromClipboard(): Observable<any> {
    return from(MainAPI.invoke('APP_READ_CLIPBOARD')).pipe(
      map((data: string) => JSON.parse(data)),
      switchMap((environment: Environment) => this.verifyData(environment)),
      switchMap((environment: Environment) => {
        const migratedEnvironment =
          this.dataService.migrateAndValidateEnvironment(environment);

        return this.addEnvironment({
          environment: migratedEnvironment,
          setActive: true
        });
      }),
      catchError((error) => {
        this.logMessage('error', 'NEW_ENVIRONMENT_CLIPBOARD_ERROR', {
          error
        });

        return EMPTY;
      })
    );
  }

  /**
   * Open an environment from a URL
   *
   * @param url
   * @returns
   */
  public newEnvironmentFromURL(url: string) {
    if (url) {
      this.logMessage('info', 'NEW_ENVIRONMENT_FROM_URL', { url });

      return this.http.get(url, { responseType: 'text' }).pipe(
        map<string, Environment>((data) => JSON.parse(data)),
        switchMap((environment: Environment) => this.verifyData(environment)),
        switchMap((environment: Environment) => {
          const migratedEnvironment =
            this.dataService.migrateAndValidateEnvironment(environment);

          return this.addEnvironment({ environment: migratedEnvironment });
        }),
        catchError((error) => {
          this.logMessage('error', 'NEW_ENVIRONMENT_URL_ERROR', {
            error
          });

          return EMPTY;
        })
      );
    }

    return EMPTY;
  }

  /**
   * Duplicate an environment, or the active environment and append it at the end of the list.
   */
  public duplicateEnvironment(
    environmentUUID: string = this.store.get('activeEnvironmentUUID')
  ) {
    if (environmentUUID) {
      const environmentToDuplicateindex = this.store
        .get('environments')
        .findIndex((environment) => environment.uuid === environmentUUID);
      const environmentToDuplicate =
        this.store.get('environments')[environmentToDuplicateindex];

      // copy the environment, reset some properties and change name
      let newEnvironment: Environment = {
        ...CloneObject(environmentToDuplicate),
        name: `${environmentToDuplicate.name} (copy)`,
        port: this.dataService.getNewEnvironmentPort()
      };

      newEnvironment = this.dataService.deduplicateUUIDs(newEnvironment, true);

      return this.addEnvironment({
        environment: newEnvironment,
        insertAfterIndex: environmentToDuplicateindex,
        setActive: true
      });
    }

    return EMPTY;
  }

  /**
   * Add a new cloud environment
   * If no environment data are provided, create a new one
   *
   * @param environment
   * @param storeUpdateOptions
   */
  public addCloudEnvironment(
    environment?: Environment,
    setActive = false,
    storeUpdateOptions = { force: false, emit: true }
  ) {
    const user = this.store.get('user');
    const cloudEnvironments = this.store
      .get('settings')
      .environments.filter(
        (environmentDescriptor) => environmentDescriptor.cloud
      );

    if (cloudEnvironments.length >= user.cloudSyncItemsQuota) {
      this.logMessage('error', 'CLOUD_QUOTA_EXCEEDED', {
        quota: user.cloudSyncItemsQuota
      });

      return EMPTY;
    } else if (getEnvironmentByteSize(environment) > user.cloudSyncSizeQuota) {
      this.logMessage('error', 'CLOUD_ENVIRONMENT_TOO_LARGE', {
        maxSize: this.store.get('user').cloudSyncSizeQuota
      });

      return EMPTY;
    }

    // if no environment provided, create a new one
    if (!environment) {
      environment = {
        ...BuildEnvironment({
          hasDefaultHeader: true,
          hasDefaultRoute: true
        }),
        // provide a name or the filename (UUID) will be used
        name: 'New cloud environment'
      };
    }

    return this.addEnvironment(
      {
        environment,
        promptSave: false,
        cloud: true,
        setActive
      },
      storeUpdateOptions
    );
  }

  /**
   * Add a new cloud environment directly from a local file
   *
   */
  public addCloudEnvironmentFromLocalFile() {
    const user = this.store.get('user');
    const cloudEnvironments = this.store
      .get('settings')
      .environments.filter(
        (environmentDescriptor) => environmentDescriptor.cloud
      );

    if (cloudEnvironments.length >= user.cloudSyncItemsQuota) {
      this.logMessage('error', 'CLOUD_QUOTA_EXCEEDED', {
        quota: user.cloudSyncItemsQuota
      });

      return EMPTY;
    }

    return this.dialogsService
      .showOpenDialog('Open environment JSON file', 'json')
      .pipe(
        filter((filePaths) => !!filePaths),
        switchMap((filePaths) =>
          this.storageService.loadEnvironment(filePaths[0]).pipe(
            switchMap((environment) => {
              if (
                getEnvironmentByteSize(environment) > user.cloudSyncSizeQuota
              ) {
                this.logMessage('error', 'CLOUD_ENVIRONMENT_TOO_LARGE', {
                  maxSize: this.store.get('user').cloudSyncSizeQuota
                });

                return EMPTY;
              }

              return of(environment);
            }),
            switchMap((environment) => this.verifyData(environment)),
            map((environment) => this.validateEnvironment(environment)),
            switchMap((environment) =>
              this.addCloudEnvironment(environment, true)
            )
          )
        )
      );
  }

  /**
   * Duplicate an environment and save it to the cloud
   */
  public duplicateToCloud(environmentUuid: string) {
    const environmentIsCloud = this.environmentIsCloud(environmentUuid);

    const environmentToDuplicate =
      this.store.getEnvironmentByUUID(environmentUuid);

    // copy the environment, reset some properties and change name
    let newEnvironment: Environment = {
      ...CloneObject(environmentToDuplicate),
      name: `${environmentToDuplicate.name} ${
        environmentIsCloud ? '(copy)' : '(cloud copy)'
      }`
    };

    newEnvironment = this.dataService.deduplicateUUIDs(newEnvironment, true);

    return this.addCloudEnvironment(newEnvironment, true);
  }

  public environmentIsCloud(environmentUuid: string) {
    return !!this.store
      .get('settings')
      .environments.find(
        (environmentItem) =>
          environmentItem.uuid === environmentUuid && environmentItem.cloud
      );
  }

  /**
   * Convert a cloud env to a local one
   * Action will get dispatched through the sync service
   *
   * @param environmentUuid
   */
  public convertCloudToLocal(environmentUuid: string) {
    return this.uiService
      .showConfirmDialog({
        title: 'Convert to local environment',
        text: 'This will delete the environment from the cloud and convert it to a local environment on all other clients. Are you sure?',
        confirmButtonText: 'Convert',
        cancelButtonText: 'Cancel'
      })
      .pipe(
        tap((confirmed) => {
          if (confirmed) {
            this.store.update(convertEnvironmentToLocalAction(environmentUuid));
          }
        })
      );
  }

  /**
   * Delete an environment from the cloud
   * Action will get dispatched through the sync service
   *
   * @param environmentUuid
   */
  public deleteFromCloud(environmentUuid: string) {
    const environmentDescriptor = this.store
      .get('settings')
      .environments.find(
        (environmentItem) => environmentItem.uuid === environmentUuid
      );

    return this.uiService
      .showConfirmDialog({
        title: 'Delete from the cloud',
        text: 'This will delete the environment from the cloud and convert it to a local environment on all other clients. Are you sure?',
        sub: `<span class="text-break-all">Your local copy located in <strong>${environmentDescriptor.path}</strong> will not be deleted.</span>`,
        subIcon: 'info',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      })
      .pipe(
        switchMap((confirmed) => {
          if (confirmed) {
            this.store.update(convertEnvironmentToLocalAction(environmentUuid));

            // Close the environment too
            return this.closeEnvironment(environmentUuid, true);
          }

          return EMPTY;
        })
      );
  }

  /**
   * Convert all the cloud environments to local ones based on the current cloud environments list
   *
   * @param currentCloudEnvironmentUuids
   */
  public convertAllToLocal(
    currentCloudEnvironmentUuids: EnvironmentsListPayload
  ) {
    const environmentDescriptors = this.store.get('settings').environments;

    const deletedCloudEnvironments = environmentDescriptors.filter(
      (environmentDescriptor) =>
        environmentDescriptor.cloud === true &&
        !currentCloudEnvironmentUuids.find(
          (currentCloudEnvironment) =>
            currentCloudEnvironment.environmentUuid ===
            environmentDescriptor.uuid
        )
    );

    // convert to local environments
    deletedCloudEnvironments.forEach((deletedCloudEnvironment) => {
      this.store.update(
        convertEnvironmentToLocalAction(deletedCloudEnvironment.uuid),
        true,
        false
      );

      const environment = this.store.getEnvironmentByUUID(
        deletedCloudEnvironment.uuid
      );
      this.logMessage('error', 'CLOUD_ENVIRONMENT_CONVERTED', {
        name: environment.name,
        uuid: environment.uuid
      });
    });
  }

  /**
   * Open an environment file and add it to the store
   *
   */
  public openEnvironment(): Observable<Environment> {
    return this.dialogsService
      .showOpenDialog('Open environment JSON file', 'json', true, true)
      .pipe(
        switchMap((filePaths) => {
          if (!filePaths) {
            return EMPTY;
          }
          const environments = this.store.get('settings').environments;

          const observables: Observable<Environment>[] = [];

          filePaths.forEach((filePath) => {
            const openedEnvironment = environments.find(
              (environmentItem) => environmentItem.path === filePath
            );

            if (openedEnvironment === undefined) {
              observables.push(
                this.storageService.loadEnvironment(filePath).pipe(
                  switchMap((environment) => this.verifyData(environment)),
                  tap((environment) => {
                    const validatedEnvironment =
                      this.dataService.migrateAndValidateEnvironment(
                        environment
                      );

                    this.store.update(
                      addEnvironmentAction(validatedEnvironment, {
                        filePath,
                        setActive: true
                      })
                    );
                  })
                )
              );
            } else if (
              openedEnvironment !== undefined &&
              filePaths.length === 1
            ) {
              this.store.update(
                setActiveEnvironmentAction(openedEnvironment.uuid)
              );
            }
          });

          return concat(...observables);
        })
      );
  }

  /**
   * Close an environment (or the current one) and update the settings
   *
   * @param environmentUUID
   */
  public closeEnvironment(
    environmentUUID: string = this.store.get('activeEnvironmentUUID'),
    force = false
  ): Observable<boolean> {
    const environmentDescriptor = this.store
      .get('settings')
      .environments.find(
        (environmentItem) => environmentItem.uuid === environmentUUID
      );

    // Do not close cloud environments
    if (environmentDescriptor.cloud && !force) {
      return of(true);
    }

    return this.storageService.saving().pipe(
      tap(() => {
        this.store.update(updateUIStateAction({ saving: true }));
      }),
      filter((saving) => !saving),
      first(),
      tap(() => {
        if (environmentUUID) {
          this.serverService.stop(environmentUUID);

          this.store.update(removeEnvironmentAction(environmentUUID));
        }
        this.store.update(updateUIStateAction({ saving: false }));
        MainAPI.invoke('APP_UNWATCH_FILE', environmentUUID);
      })
    );
  }

  /**
   * Add a new folder and save it in the store
   */
  public addFolder(folderId: string | 'root') {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (activeEnvironment) {
      this.store.update(
        addFolderAction(activeEnvironment.uuid, BuildFolder(), folderId, true)
      );
    }
  }

  /**
   * Enable and disable routes in a folder
   */
  public toggleFolder(folderId: string | 'root') {
    const activeEnvironment = this.store.getActiveEnvironment();
    const selectedFolder = activeEnvironment.folders.find(
      (folder) => folder.uuid === folderId
    );

    for (const child of selectedFolder.children) {
      if (child.type === 'route') {
        this.toggleRoute(child.uuid);
      }
    }
  }

  /**
   * Update a folder and save it in the store
   */
  public updateFolder(folderUuid: string, folderProperties: Partial<Folder>) {
    this.store.update(
      updateFolderAction(
        this.store.getActiveEnvironment().uuid,
        folderUuid,
        folderProperties
      )
    );
  }

  /**
   * Toogle a folder collapse state and save it in the store
   */
  public toggleFolderCollapse(folderUuid: string) {
    const activeEnvironment = this.store.getActiveEnvironment();
    const selectedFolder = activeEnvironment.folders.find(
      (folder) => folder.uuid === folderUuid
    );

    if (selectedFolder) {
      const collapsedFolders = {
        ...this.store.get('settings').collapsedFolders
      };

      if (!collapsedFolders[activeEnvironment.uuid]) {
        collapsedFolders[activeEnvironment.uuid] = [];
      }

      if (
        collapsedFolders[activeEnvironment.uuid].includes(selectedFolder.uuid)
      ) {
        collapsedFolders[activeEnvironment.uuid] = collapsedFolders[
          activeEnvironment.uuid
        ].filter(
          (collapsedFolderUuid) => collapsedFolderUuid !== selectedFolder.uuid
        );
      } else {
        collapsedFolders[activeEnvironment.uuid] = [
          ...collapsedFolders[activeEnvironment.uuid],
          selectedFolder.uuid
        ];
      }

      this.store.update(updateSettingsAction({ collapsedFolders }));
    }
  }

  /**
   * Remove a folder and save.
   * Move all children to the parent container (root or folder) one by one
   */
  public removeFolder(folderUuid: string) {
    if (folderUuid) {
      this.store.update(
        removeFolderAction(this.store.getActiveEnvironment().uuid, folderUuid)
      );
    }
  }

  /**
   * Add a new HTTP route and save it in the store
   */
  public addHTTPRoute(folderId: string | 'root', route?: Route) {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (activeEnvironment) {
      this.store.update(
        addRouteAction(
          activeEnvironment.uuid,
          route ? route : BuildHTTPRoute(true),
          folderId,
          true
        )
      );

      setTimeout(() => {
        this.uiService.focusInput(FocusableInputs.ROUTE_PATH);
      }, 0);
    }
  }

  /**
   * Add a new CRUD route and save it in the store
   */
  public addCRUDRoute(
    folderId: string | 'root',
    options: {
      endpoint: typeof RouteDefault.endpoint;
      dataBucket: Partial<DataBucket>;
    } = {
      endpoint: RouteDefault.endpoint,
      dataBucket: null
    }
  ) {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (activeEnvironment) {
      let newCRUDRoute = BuildCRUDRoute(true, {
        endpoint: options.endpoint,
        databucketID: RouteResponseDefault.databucketID
      });

      if (options.dataBucket) {
        const newBucket = this.addDatabucket(options.dataBucket);

        newCRUDRoute = BuildCRUDRoute(true, {
          endpoint: options.endpoint,
          databucketID: newBucket.id
        });
      }

      this.store.update(
        addRouteAction(activeEnvironment.uuid, newCRUDRoute, folderId, true)
      );

      setTimeout(() => {
        this.uiService.focusInput(FocusableInputs.ROUTE_PATH);
      }, 0);
    }
  }

  /**
   * Add a new databucket and save it in the store
   */
  public addDatabucket(dataBucket: Partial<DataBucket> = null) {
    const activeEnvironment = this.store.getActiveEnvironment();
    if (activeEnvironment) {
      let newDatabucket = BuildDatabucket(dataBucket);
      newDatabucket = this.dataService.deduplicateDatabucketID(newDatabucket);

      this.store.update(
        addDatabucketAction(activeEnvironment.uuid, newDatabucket, true)
      );

      setTimeout(() => {
        this.uiService.focusInput(FocusableInputs.DATABUCKET_NAME);
      }, 0);

      return newDatabucket;
    }

    return null;
  }

  /**
   * Add a new callback and save it in the store.
   */
  public addCallback() {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (activeEnvironment) {
      let newCallback = BuildCallback();
      newCallback = this.dataService.deduplicateCallbackID(newCallback);

      this.store.update(
        addCallbackAction(activeEnvironment.uuid, newCallback, true)
      );

      setTimeout(() => {
        this.uiService.focusInput(FocusableInputs.CALLBACK_NAME);
      }, 0);
    }
  }

  /**
   * Add a new route and save it in the store
   */
  public addRouteFromClipboard() {
    return from(MainAPI.invoke('APP_READ_CLIPBOARD')).pipe(
      map((data: string) => JSON.parse(data)),
      switchMap((route: Route) => {
        route = RouteSchema.validate(route).value;
        route = this.dataService.renewRouteUUIDs(route);

        // if has a current environment append imported route
        if (this.store.get('activeEnvironmentUUID')) {
          this.store.update(
            addRouteAction(
              this.store.get('activeEnvironmentUUID'),
              route,
              'root',
              true
            )
          );

          return EMPTY;
        } else {
          return this.addEnvironment({
            setActive: true,
            environment: {
              ...BuildEnvironment({
                hasDefaultHeader: true,
                hasDefaultRoute: true,
                port: this.dataService.getNewEnvironmentPort()
              }),
              routes: [route],
              rootChildren: [{ type: 'route', uuid: route.uuid }]
            }
          });
        }
      }),
      tap(() => {
        this.uiService.focusInput(FocusableInputs.ROUTE_PATH);
      }),
      catchError((error) => {
        this.logMessage('error', 'NEW_ROUTE_CLIPBOARD_ERROR', {
          error
        });

        return EMPTY;
      })
    );
  }

  /**
   * Add a new route response and save it in the store
   */
  public addRouteResponse() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();

    this.store.update(
      addRouteResponseAction(
        activeEnvironment.uuid,
        activeRoute.uuid,
        BuildRouteResponse(),
        true
      )
    );
  }

  /**
   * Set active databucket by UUID
   */
  public setActiveDatabucket(databucketUUID: string) {
    const activeDatabucketUUID = this.store.get('activeDatabucketUUID');

    if (activeDatabucketUUID !== databucketUUID) {
      this.store.update(setActiveDatabucketAction(databucketUUID));
    }
  }

  /**
   * Set active callback by UUID
   */
  public setActiveCallback(callbackUUID: string) {
    const activeCallbackUUID = this.store.get('activeCallbackUUID');

    if (activeCallbackUUID !== callbackUUID) {
      this.store.update(setActiveCallbackAction(callbackUUID));
    }
  }

  /**
   * Duplicate the given route response and save it in the store
   */
  public duplicateRouteResponse() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();
    const activeRouteResponse = this.store.getActiveRouteResponse();

    this.store.update(
      addRouteResponseAction(
        activeEnvironment.uuid,
        activeRoute.uuid,
        CloneRouteResponse(activeRouteResponse),
        true,
        activeRouteResponse.uuid
      )
    );
  }

  /**
   * Duplicate a route, or the current active route and append it at the end of the list in the same folder
   */
  public duplicateRoute(parentId: string | 'root', routeUUID?: string) {
    let routeToDuplicate = this.store.getActiveRoute();
    const activeEnvironment = this.store.getActiveEnvironment();

    if (routeUUID) {
      routeToDuplicate = activeEnvironment.routes.find(
        (route) => route.uuid === routeUUID
      );
    }

    if (routeToDuplicate) {
      let newRoute: Route = CloneObject(routeToDuplicate);
      newRoute = this.dataService.renewRouteUUIDs(newRoute);

      this.store.update(
        addRouteAction(activeEnvironment.uuid, newRoute, parentId, true)
      );
    }
  }

  /**
   * Duplicate a route to another environment
   */
  public duplicateRouteInAnotherEnvironment(
    routeUUID: string,
    targetEnvironmentUUID: string
  ) {
    const routeToDuplicate = this.store.getRouteByUUID(routeUUID);

    if (routeToDuplicate) {
      let newRoute: Route = CloneObject(routeToDuplicate);
      newRoute = this.dataService.renewRouteUUIDs(newRoute);

      this.store.update(
        duplicateRouteToAnotherEnvironmentAction(
          newRoute,
          targetEnvironmentUUID
        )
      );
    }
  }

  /**
   * Duplicate a databucket, or the current active databucket and append it at the end
   */
  public duplicateDatabucket(databucketUUID: string) {
    const activeEnvironment = this.store.getActiveEnvironment();
    const databucketToDuplicate = activeEnvironment.data.find(
      (data) => data.uuid === databucketUUID
    );

    if (databucketToDuplicate) {
      const newDatabucket: DataBucket = CloneDataBucket(databucketToDuplicate);

      this.store.update(
        addDatabucketAction(
          activeEnvironment.uuid,
          newDatabucket,
          true,
          databucketToDuplicate.uuid
        )
      );
    }
  }

  /**
   * Duplicate a callback, or the current active callback and append it at the end
   */
  public duplicateCallback(callbackUuid: string) {
    const activeEnvironment = this.store.getActiveEnvironment();
    const callbackToDuplicate = activeEnvironment.callbacks.find(
      (callback) => callback.uuid === callbackUuid
    );

    if (callbackToDuplicate) {
      const newCallback: Callback = CloneCallback(callbackToDuplicate);

      this.store.update(
        addCallbackAction(
          activeEnvironment.uuid,
          newCallback,
          true,
          callbackToDuplicate.uuid
        )
      );
    }
  }

  /**
   * Duplicate a databucket to another environment
   */
  public duplicateDatabucketInAnotherEnvironment(
    databucketUUID: string,
    targetEnvironmentUUID: string
  ) {
    const databucketToDuplicate =
      this.store.getDatabucketByUUID(databucketUUID);

    if (databucketToDuplicate) {
      let newDatabucket: DataBucket = {
        ...CloneObject(databucketToDuplicate),
        uuid: generateUUID()
      };
      newDatabucket = this.dataService.deduplicateDatabucketID(newDatabucket);

      this.store.update(
        duplicateDatabucketToAnotherEnvironmentAction(
          newDatabucket,
          targetEnvironmentUUID
        )
      );
    }
  }

  /**
   * Duplicate a callback to another environment
   */
  public duplicateCallbackInAnotherEnvironment(
    callbackUUID: string,
    targetEnvironmentUUID: string
  ) {
    const callbackToDuplicate = this.store.getCallbackByUUID(callbackUUID);

    if (callbackToDuplicate) {
      let newCallback: Callback = {
        ...CloneObject(callbackToDuplicate),
        uuid: generateUUID()
      };
      newCallback = this.dataService.deduplicateCallbackID(newCallback);

      this.store.update(
        duplicateCallbackToAnotherEnvironmentAction(
          newCallback,
          targetEnvironmentUUID
        )
      );
    }
  }

  /**
   * Remove a route and save
   */
  public removeRoute(routeUuid: string = this.store.get('activeRouteUUID')) {
    if (routeUuid) {
      this.store.update(
        removeRouteAction(this.store.getActiveEnvironment().uuid, routeUuid)
      );
    }
  }

  /**
   * Remove current route response and save
   */
  public removeRouteResponse() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();
    const activeRouteResponse = this.store.getActiveRouteResponse();

    // we shouldn't be able to remove the last route response
    if (
      (activeRoute.type === RouteType.HTTP &&
        activeRoute.responses.length > 1) ||
      (activeRoute.type === RouteType.CRUD &&
        !activeRouteResponse.default &&
        activeRoute.responses.length > 1)
    ) {
      this.store.update(
        removeRouteResponseAction(
          activeEnvironment.uuid,
          activeRoute.uuid,
          activeRouteResponse.uuid
        )
      );
    }
  }

  /**
   * Remove a databucket
   */
  public removeDatabucket(
    databucketUuid: string = this.store.get('activeDatabucketUUID')
  ) {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (databucketUuid) {
      this.store.update(
        removeDatabucketAction(activeEnvironment.uuid, databucketUuid)
      );
    }
  }

  /**
   * Remove a callback
   */
  public removeCallback(callbackUuid: string) {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (callbackUuid) {
      this.store.update(
        removeCallbackAction(activeEnvironment.uuid, callbackUuid)
      );
    }
  }

  /**
   * Enable and disable a route
   */
  public toggleRoute(routeUuid?: string) {
    const activeEnvironment = this.store.getActiveEnvironment();
    const selectedRoute = activeEnvironment.routes.find(
      (route) => route.uuid === routeUuid
    );

    if (selectedRoute) {
      const disabledRoutes = { ...this.store.get('settings').disabledRoutes };

      if (!disabledRoutes[activeEnvironment.uuid]) {
        disabledRoutes[activeEnvironment.uuid] = [];
      }

      if (disabledRoutes[activeEnvironment.uuid].includes(selectedRoute.uuid)) {
        disabledRoutes[activeEnvironment.uuid] = disabledRoutes[
          activeEnvironment.uuid
        ].filter(
          (disabledRouteUuid) => disabledRouteUuid !== selectedRoute.uuid
        );
      } else {
        disabledRoutes[activeEnvironment.uuid] = [
          ...disabledRoutes[activeEnvironment.uuid],
          selectedRoute.uuid
        ];
      }

      this.store.update(updateSettingsAction({ disabledRoutes }));

      const environmentsStatus = this.store.get('environmentsStatus');
      const activeEnvironmentStatus =
        environmentsStatus[activeEnvironment.uuid];

      if (activeEnvironmentStatus.running) {
        this.store.update(
          updateEnvironmentStatusAction(
            {
              needRestart: true
            },
            activeEnvironment.uuid
          )
        );
      }
    }
  }

  /**
   * Set active tab
   */
  public setActiveTab(activeTab: TabsNameType) {
    // in the first response of a crud route two tabs are disabled
    if (
      this.store.getActiveRoute().type === RouteType.CRUD &&
      this.store.getActiveRouteResponse().default &&
      (activeTab === 'SETTINGS' || activeTab === 'RULES')
    ) {
      return;
    }

    this.store.update(setActiveTabAction(activeTab));
  }

  /**
   * Set active tab of callback view.
   */
  public setActiveTabInCallbackView(activeTab: CallbackTabsNameType) {
    const activeSpecTab = this.store.getSelectedSpecTabInCallbackView();

    this.store.update(
      setActiveTabInCallbackViewAction(activeTab, activeSpecTab)
    );
  }

  /**
   * Set active spec tab of callback view.
   */
  public setActiveSpecTabInCallbackView(
    activeSpecTab: CallbackSpecTabNameType
  ) {
    const activeTab = this.store.getSelectedCallbackTab();

    this.store.update(
      setActiveTabInCallbackViewAction(activeTab, activeSpecTab)
    );
  }

  /**
   * Navigate to callback usage.
   */
  public navigateToCallbackUsageInRoute(
    callbackUsage: CallbackUsage,
    callbackResponse: CallbackResponseUsage
  ) {
    this.setActiveView('ENV_ROUTES');
    this.setActiveRoute(callbackUsage.routeUUID);
    if (callbackResponse) {
      this.setActiveRouteResponse(callbackResponse.responseUUID);
    }
    this.setActiveTab('CALLBACKS');
  }

  /**
   * Set active environment logs tab
   */
  public setActiveEnvironmentLogTab(activeTab: EnvironmentLogsTabsNameType) {
    this.store.update(setActiveEnvironmentLogTabAction(activeTab));
  }

  /**
   * Set active view
   */
  public setActiveView(activeView: ViewsNameType) {
    this.store.update(setActiveViewAction(activeView));
  }

  /**
   * Set active route response
   */
  public setActiveRouteResponse(routeResponseUUID: string) {
    this.store.update(setActiveRouteResponseAction(routeResponseUUID));
  }

  /**
   * Set active environment log for a given environment
   */
  public setActiveEnvironmentActiveLog(environmentLogUUID: string) {
    this.store.update(
      setActiveEnvironmentLogUUIDAction(
        this.store.get('activeEnvironmentUUID'),
        environmentLogUUID
      )
    );
  }

  /**
   * Update the active environment
   */
  public updateActiveEnvironment(
    properties: Partial<Environment>,
    force = false
  ) {
    this.store.update(
      updateEnvironmentAction(
        this.store.get('activeEnvironmentUUID'),
        properties
      ),
      force
    );
  }

  /**
   * Update the active route
   */
  public updateActiveRoute(properties: Partial<Route>) {
    this.store.update(
      updateRouteAction(
        this.store.getActiveEnvironment().uuid,
        this.store.getActiveRoute().uuid,
        properties
      )
    );
  }

  /**
   * Update the active route response
   */
  public updateActiveRouteResponse(
    properties: Partial<RouteResponse>,
    forceUpdate = false
  ) {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();
    const activeRouteResponse = this.store.getActiveRouteResponse();

    this.store.update(
      updateRouteResponseAction(
        activeEnvironment.uuid,
        activeRoute.uuid,
        activeRouteResponse.uuid,
        properties
      ),
      forceUpdate
    );
  }

  /**
   * Set the route response as default
   */
  public setDefaultRouteResponse(routeResponseUuid: string) {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();

    this.store.update(
      updateRouteResponseAction(
        activeEnvironment.uuid,
        activeRoute.uuid,
        routeResponseUuid,
        { default: true }
      )
    );
  }

  /**
   * Navigates to the definition of the provided callback by id.
   */
  public navigateToCallbackDefinition(callbackUUID: string) {
    const activeSpecTab = this.store.getSelectedSpecTabInCallbackView();

    this.store.update(setActiveViewAction('ENV_CALLBACKS'));
    this.store.update(setActiveCallbackAction(callbackUUID));
    this.store.update(setActiveTabInCallbackViewAction('SPEC', activeSpecTab));
  }

  /**
   * Update the active databucket
   */
  public updateActiveDatabucket(properties: Partial<DataBucket>) {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeDatabucket = this.store.getActiveDatabucket();

    this.store.update(
      updateDatabucketAction(
        activeEnvironment.uuid,
        activeDatabucket.uuid,
        properties
      )
    );
  }

  /**
   * Update the active databucket
   */
  public updateActiveCallback(properties: Partial<Callback>) {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeCallback = this.store.getActiveCallback();

    this.store.update(
      updateCallbackAction(
        activeEnvironment.uuid,
        activeCallback.uuid,
        properties
      )
    );
  }

  /**
   * Start / stop an environment (default to active one)
   */
  public toggleEnvironment(
    environmentUUID = this.store.get('activeEnvironmentUUID')
  ) {
    const environment = this.store.getEnvironmentByUUID(environmentUUID);
    const environmentPath = this.store.getEnvironmentPath(environment.uuid);

    if (!environment) {
      return;
    }

    const environmentsStatus = this.store.get('environmentsStatus');
    const activeEnvironmentStatus = environmentsStatus[environment.uuid];

    if (activeEnvironmentStatus.running) {
      this.serverService.stop(environment.uuid);

      if (activeEnvironmentStatus.needRestart) {
        this.serverService.start(environment, environmentPath);
      }
    } else {
      this.serverService.start(environment, environmentPath);
    }
  }

  /**
   * Start / stop all environments
   */
  public toggleAllEnvironments() {
    const environments = this.store.get('environments');
    const environmentsStatus = this.store.get('environmentsStatus');

    // check if environments should be started or stopped. If at least one env is turned off, we'll turn all on
    const shouldStart = Object.keys(environmentsStatus).some(
      (environmentUUID) =>
        !environmentsStatus[environmentUUID].running ||
        environmentsStatus[environmentUUID].needRestart
    );

    environments.map((environment) => {
      const environmentState = environmentsStatus[environment.uuid];
      const environmentPath: EnvironmentDescriptor[] =
        this.store.get('settings').environments;
      const activeEnvironmentPath = environmentPath.find(
        (path) => path.uuid === environment.uuid
      ).path;

      if (shouldStart) {
        if (!environmentState.running || environmentState.needRestart) {
          // if needs restart, we need to stop first to prevent EADDRINUSE errors
          if (environmentState.needRestart) {
            this.serverService.stop(environment.uuid);
          }

          this.serverService.start(environment, activeEnvironmentPath);
        }
      } else {
        if (environmentState.running) {
          this.serverService.stop(environment.uuid);
        }
      }
    });
  }

  /**
   * Reorder an items list
   */
  public reorderItems(
    reorderAction: ReorderAction<string>,
    type: ReorderableContainers
  ) {
    const activeEnvironmentUuid = this.store.getActiveEnvironment().uuid;
    let activeRouteUuid: string;
    let storeAction: Actions;

    switch (type) {
      case ReorderableContainers.ENVIRONMENTS:
        storeAction = reorderEnvironmentsAction(reorderAction);
        break;

      case ReorderableContainers.ROUTES:
        storeAction = reorderRoutesAction(activeEnvironmentUuid, reorderAction);
        break;

      case ReorderableContainers.ROUTE_RESPONSES:
        activeRouteUuid = this.store.getActiveRoute().uuid;
        storeAction = reorderRouteResponsesAction(
          activeEnvironmentUuid,
          activeRouteUuid,
          reorderAction
        );
        break;

      case ReorderableContainers.DATABUCKETS:
        storeAction = reorderDatabucketsAction(
          activeEnvironmentUuid,
          reorderAction
        );
        break;

      case ReorderableContainers.CALLBACKS:
        storeAction = reorderCallbacksAction(
          activeEnvironmentUuid,
          reorderAction
        );
        break;
      default:
        break;
    }

    this.store.update(storeAction);
  }

  /**
   * Create a route based on a environment log entry
   */
  public createRouteFromLog(
    environmentUuid: string,
    logUUID: string,
    force = false
  ) {
    const environmentsLogs = this.store.get('environmentsLogs');
    const targetEnvironment = this.store.getEnvironmentByUUID(environmentUuid);
    const log = environmentsLogs[environmentUuid].find(
      (environmentLog) => environmentLog.UUID === logUUID
    );

    if (log) {
      let routeResponse: RouteResponse;
      const prefix = targetEnvironment.endpointPrefix;
      let endpoint = log.url.slice(1); // Remove the initial slash '/'
      if (prefix && endpoint.startsWith(prefix)) {
        endpoint = endpoint.slice(prefix.length + 1); // Remove the prefix and the slash
      }

      // escape parantheses with backslashes because they are
      // otherwise interpreted as regex groups by path-to-regexp
      endpoint = endpoint.replace(/\(/g, '\\(').replace(/\)/g, '\\)');

      // check if route already exists
      if (
        !force &&
        environmentHasRoute(targetEnvironment, {
          endpoint,
          method: log.method,
          type: RouteType.HTTP
        })
      ) {
        return;
      }

      if (log.response) {
        const headers: Header[] = [];
        log.response.headers.forEach((header) => {
          if (
            [
              'content-encoding',
              'transfer-encoding',
              'content-length'
            ].includes(header.key)
          ) {
            return;
          }

          headers.push(BuildHeader(header.key, header.value));
        });

        if (log.response.body) {
          headers.push(
            BuildHeader('content-length', log.response.body.length.toString())
          );
        }

        routeResponse = {
          ...BuildRouteResponse(),
          headers,
          statusCode: log.response.status,
          body: log.response.body
        };
      } else {
        routeResponse = BuildRouteResponse();
      }

      const newRoute: Route = {
        ...BuildHTTPRoute(),
        method: log.method,
        endpoint,
        responses: [routeResponse]
      };

      this.store.update(
        addRouteAction(environmentUuid, newRoute, 'root', force)
      );
    }
  }

  /**
   * Sends an event for further process of entity movement
   */
  public startEntityDuplicationToAnotherEnvironment(
    subjectUUID: string,
    subject: DataSubject
  ) {
    this.store.update(
      startEntityDuplicationToAnotherEnvironmentAction(subjectUUID, subject)
    );

    this.uiService.openModal('duplicate_to_environment');
  }

  /**
   * Reveal an environment file in a folder
   *
   * @param environmentUUID
   */
  public showEnvironmentFileInFolder(environmentUUID: string) {
    const settings = this.store.get('settings');
    const environmentPath = settings.environments.find(
      (environment) => environment.uuid === environmentUUID
    ).path;

    MainAPI.send('APP_SHOW_FILE', environmentPath);
  }

  /**
   * Move an environment file to a folder
   *
   * @param environmentUUID
   */
  public moveEnvironmentFileToFolder(environmentUUID: string) {
    const settings = this.store.get('settings');
    const environmentInfo = settings.environments.find(
      (environment) => environment.uuid === environmentUUID
    );

    // prefill dialog with current environment folder and filename
    return this.dialogsService
      .showSaveDialog('Choose a folder', true, environmentInfo.path)
      .pipe(
        switchMap((filePath) => {
          if (!filePath) {
            return EMPTY;
          }

          if (
            this.store
              .get('settings')
              .environments.find(
                (environmentItem) => environmentItem.path === filePath
              ) !== undefined
          ) {
            return throwError(() => 'ENVIRONMENT_FILE_IN_USE');
          }

          return zip(
            of(filePath),
            from(MainAPI.invoke('APP_GET_FILENAME', filePath))
          );
        }),
        catchError((errorCode) => {
          this.logMessage('error', errorCode as MessageCodes);

          return EMPTY;
        }),
        tap(([filePath]) => {
          this.store.update(
            updateSettingsAction({
              environments: settings.environments.map((environment) => {
                if (environment.uuid === environmentUUID) {
                  return {
                    ...environment,
                    uuid: environmentUUID,
                    path: filePath
                  };
                }

                return environment;
              })
            })
          );

          // trigger a save to update the environment file, otherwise file will be created only during next modification
          this.store.update(refreshEnvironmentAction(environmentUUID));

          this.logMessage('info', 'ENVIRONMENT_MOVED', {
            environmentUUID
          });
        })
      );
  }

  /**
   * Copy an environment JSON to the clipboard
   *
   * @param environmentUUID
   */
  public copyEnvironmentToClipboard(environmentUUID: string) {
    const environment = this.store.getEnvironmentByUUID(environmentUUID);

    try {
      MainAPI.send('APP_WRITE_CLIPBOARD', JSON.stringify(environment, null, 4));

      this.logMessage('info', 'COPY_ENVIRONMENT_CLIPBOARD_SUCCESS');
    } catch (error) {
      this.logMessage('error', 'COPY_ENVIRONMENT_CLIPBOARD_ERROR', {
        environmentUUID,
        error
      });
    }
  }

  /**
   * copy a route from the active environment to the clipboard
   *
   * @param routeUUID
   */
  public copyRouteToClipboard(routeUUID: string) {
    const route = this.store.getRouteByUUID(routeUUID);

    try {
      MainAPI.send('APP_WRITE_CLIPBOARD', JSON.stringify(route, null, 4));

      this.logMessage('info', 'COPY_ROUTE_CLIPBOARD_SUCCESS');
    } catch (error) {
      this.logMessage('error', 'COPY_ROUTE_CLIPBOARD_ERROR', {
        routeUUID,
        error
      });
    }
  }

  /**
   * Listen to server transactions and record them
   *
   * @returns
   */
  public listenServerTransactions() {
    return this.eventsService.serverTransaction$.pipe(
      tap((data) => {
        const formattedLog = this.dataService.formatLog(data.transaction);

        this.store.update(logRequestAction(data.environmentUUID, formattedLog));

        if (
          this.eventsService.logsRecording$.value[data.environmentUUID] === true
        ) {
          this.createRouteFromLog(data.environmentUUID, formattedLog.UUID);
        }
      })
    );
  }

  public startRecording(environmentUuid: string) {
    this.eventsService.logsRecording$.next({
      ...this.eventsService.logsRecording$.value,
      [environmentUuid]: true
    });

    const environmentsStatus = this.store.get('environmentsStatus');
    const activeEnvironmentStatus = environmentsStatus[environmentUuid];

    if (!activeEnvironmentStatus.running) {
      this.toggleEnvironment(environmentUuid);
    }
  }

  public stopRecording(environmentUuid: string) {
    this.eventsService.logsRecording$.next({
      ...this.eventsService.logsRecording$.value,
      [environmentUuid]: false
    });
  }

  public isRecording(environmentUuid: string) {
    return this.eventsService.logsRecording$.value[environmentUuid];
  }

  public addEnvironmentHeader() {
    const activeEnvironment = this.store.getActiveEnvironment();

    this.store.update(
      updateEnvironmentAction(activeEnvironment.uuid, {
        headers: [...activeEnvironment.headers, BuildHeader()]
      }),
      // force as it is not a UI update
      true
    );
  }

  /**
   * Add a new route response header and save it in the store
   * Currently used by the command palette, otherwise a header update is UI driven
   */
  public addRouteResponseHeader() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();
    const activeRouteResponse = this.store.getActiveRouteResponse();

    this.store.update(
      updateRouteResponseAction(
        activeEnvironment.uuid,
        activeRoute.uuid,
        activeRouteResponse.uuid,
        {
          headers: [...activeRouteResponse.headers, BuildHeader()]
        }
      ),
      // force as it is not a UI update
      true
    );
  }

  /**
   * Verify data is not too recent or is a mockoon file.
   * To be used in switchMap mostly.
   *
   * @param environment
   * @returns
   */
  private verifyData(environment: Environment): Observable<Environment> {
    if (!environment || typeof environment !== 'object') {
      this.logMessage('error', 'ENVIRONMENT_INVALID');

      return EMPTY;
    }

    if (environment.lastMigration > HighestMigrationId) {
      this.logMessage('info', 'ENVIRONMENT_MORE_RECENT_VERSION', {
        environmentName: environment.name,
        environmentUUID: environment.uuid
      });

      return EMPTY;
    }

    if (environment.lastMigration === undefined) {
      return this.uiService
        .showConfirmDialog({
          title: 'Confirm opening',
          text: 'This content does not seem to be a valid Mockoon environment. Open it anyway?',
          sub: 'Mockoon will attempt to migrate and repair the content, which may be altered and overwritten.',
          subIcon: 'warning',
          subIconClass: 'text-warning'
        })
        .pipe(switchMap((confirmed) => (confirmed ? of(environment) : EMPTY)));
    }

    return of(environment);
  }

  /**
   * Validate/migrate the environment
   *
   * @param environment
   */
  private validateEnvironment(environment: Environment) {
    return this.dataService.migrateAndValidateEnvironment(environment);
  }
}
