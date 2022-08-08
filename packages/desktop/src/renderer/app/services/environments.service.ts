import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BuildDatabucket,
  BuildDemoEnvironment,
  BuildEnvironment,
  BuildHeader,
  BuildRoute,
  BuildRouteResponse,
  CloneObject,
  CloneRouteResponse,
  DataBucket,
  Environment,
  EnvironmentDefault,
  Header,
  HighestMigrationId,
  IsLegacyExportData,
  Route,
  RouteResponse,
  RouteSchema,
  UnwrapLegacyExport
} from '@mockoon/commons';
import {
  BehaviorSubject,
  concat,
  EMPTY,
  forkJoin,
  from,
  Observable,
  of,
  Subject,
  throwError,
  zip
} from 'rxjs';
import {
  catchError,
  debounceTime,
  delay,
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
import { HumanizeText } from 'src/renderer/app/libs/utils.lib';
import { DatabucketProperties } from 'src/renderer/app/models/databucket.model';
import { EnvironmentProperties } from 'src/renderer/app/models/environment.model';
import { MessageCodes } from 'src/renderer/app/models/messages.model';
import {
  RouteProperties,
  RouteResponseProperties
} from 'src/renderer/app/models/route.model';
import {
  EnvironmentLogsTabsNameType,
  TabsNameType,
  ViewsNameType
} from 'src/renderer/app/models/store.model';
import {
  DraggableContainerNames,
  ScrollDirection
} from 'src/renderer/app/models/ui.model';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { ServerService } from 'src/renderer/app/services/server.service';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import {
  addDatabucketAction,
  addEnvironmentAction,
  addRouteAction,
  addRouteResponseAction,
  duplicateDatabucketToAnotherEnvironmentAction,
  duplicateRouteToAnotherEnvironmentAction,
  moveDatabucketsAction,
  moveEnvironmentsAction,
  moveRouteResponsesAction,
  moveRoutesAction,
  navigateEnvironmentsAction,
  navigateRoutesAction,
  reloadEnvironmentAction,
  removeDatabucketAction,
  removeEnvironmentAction,
  removeRouteAction,
  removeRouteResponseAction,
  setActiveDatabucketAction,
  setActiveEnvironmentAction,
  setActiveEnvironmentLogTabAction,
  setActiveEnvironmentLogUUIDAction,
  setActiveRouteAction,
  setActiveRouteResponseAction,
  setActiveTabAction,
  setActiveViewAction,
  startEntityDuplicationToAnotherEnvironmentAction,
  updateDatabucketAction,
  updateEnvironmentAction,
  updateRouteAction,
  updateRouteResponseAction,
  updateSettingsAction,
  updateUIStateAction
} from 'src/renderer/app/stores/actions';
import { ReducerDirectionType } from 'src/renderer/app/stores/reducer';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';
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
    super('[SERVICE][ENVIRONMENTS]', toastService);
  }

  /**
   * Load environments after waiting for the settings to load
   *
   * @returns
   */
  public loadEnvironments(): Observable<
    { environment: Environment; path: string }[]
  > {
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

          return of([
            {
              environment: defaultEnvironment,
              path: demoFilePath
            }
          ]);
        }

        return forkJoin(
          settings.environments.map((environmentItem) =>
            this.storageService.loadEnvironment(environmentItem.path).pipe(
              map((environment) =>
                environment
                  ? {
                      environment,
                      path: environmentItem.path
                    }
                  : null
              )
            )
          )
        );
      }),
      // filter empty environments (file not found) and environments migrated with more recent app version (or lastMigration do not exists < v1.7.0)
      map((environmentsData) =>
        environmentsData.filter(
          (environmentData) =>
            !!environmentData &&
            (environmentData.environment.lastMigration === undefined ||
              environmentData.environment.lastMigration <= HighestMigrationId)
        )
      ),
      tap((environmentsData) => {
        environmentsData.forEach((environmentData) => {
          environmentData.environment =
            this.dataService.migrateAndValidateEnvironment(
              environmentData.environment
            );

          this.store.update(
            addEnvironmentAction(
              environmentData.environment,
              // keep the first environment as active during load
              { activeEnvironment: environmentsData[0].environment }
            )
          );
        });

        this.store.update(
          updateSettingsAction({
            environments: environmentsData.map((environmentData) => ({
              uuid: environmentData.environment.uuid,
              path: environmentData.path
            }))
          })
        );
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
            path: settings.environments.find(
              (environmentItem) => environmentItem.uuid === environment.uuid
            )?.path
          })),
          filter((environmentInfo) => environmentInfo.path !== undefined),
          mergeMap((environmentInfo) =>
            this.storageService.saveEnvironment(
              environmentInfo.data,
              environmentInfo.path,
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

      const confirmReload$ = new Subject<boolean>();

      this.eventsService.confirmModalEvents.next({
        title: 'External changes detected',
        text: 'The following environments were modified outside Mockoon:',
        sub: 'You can disable file monitoring in the application settings (Ctrl + Comma)',
        confirmButtonText: 'Reload all',
        cancelButtonText: 'Ignore',
        subIcon: 'info',
        subIconClass: 'text-primary',
        list$: this.environmentChanges$.pipe(
          map((environmentChanges) =>
            environmentChanges.map(
              (environmentChange) => environmentChange.name
            )
          )
        ),
        confirmed$: confirmReload$
      });

      return confirmReload$.pipe(
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
      }),
      delay(1000),
      tap(() => {
        this.store.update(setActiveViewAction('ENV_ROUTES'));
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
   * Set active route by UUID or navigation
   */
  public setActiveRoute(routeUUIDOrDirection: string | ReducerDirectionType) {
    const activeRouteUUID = this.store.get('activeRouteUUID');

    if (activeRouteUUID && activeRouteUUID !== routeUUIDOrDirection) {
      if (
        routeUUIDOrDirection === 'next' ||
        routeUUIDOrDirection === 'previous'
      ) {
        this.store.update(navigateRoutesAction(routeUUIDOrDirection));
      } else {
        this.store.update(setActiveRouteAction(routeUUIDOrDirection));
      }
    }
  }

  /**
   * Add a new default environment, or the one provided, and save it in the store
   */
  public addEnvironment(
    environment?: Environment,
    insertAfterIndex?: number
  ): Observable<[string, string]> {
    return from(
      this.dialogsService.showSaveDialog('Save your new environment')
    ).pipe(
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
          return throwError('ENVIRONMENT_FILE_IN_USE');
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
      tap(([filePath, filename]) => {
        const newEnvironment = environment
          ? environment
          : BuildEnvironment({
              hasDefaultHeader: true,
              hasDefaultRoute: true,
              port: this.dataService.getNewEnvironmentPort()
            });

        // if a non-default name has been set already (imports), do not use the filename
        if (newEnvironment.name === EnvironmentDefault.name) {
          newEnvironment.name = HumanizeText(filename);
        }

        this.store.update(
          addEnvironmentAction(newEnvironment, {
            filePath,
            insertAfterIndex
          })
        );

        this.uiService.scrollEnvironmentsMenu.next(ScrollDirection.BOTTOM);
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

        return this.addEnvironment(migratedEnvironment);
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

          return this.addEnvironment(migratedEnvironment);
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
  ): Observable<[string, string]> {
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

      newEnvironment = this.dataService.renewEnvironmentUUIDs(newEnvironment);

      return this.addEnvironment(newEnvironment, environmentToDuplicateindex);
    }

    return EMPTY;
  }

  /**
   * Open an environment file and add it to the store
   *
   */
  public openEnvironment(): Observable<Environment> {
    return from(
      this.dialogsService.showOpenDialog('Open environment JSON file', 'json')
    ).pipe(
      filter((filePath) => {
        if (!filePath) {
          return false;
        }

        // set environment as active if already opened
        const openedEnvironment = this.store
          .get('settings')
          .environments.find(
            (environmentItem) => environmentItem.path === filePath
          );

        if (openedEnvironment !== undefined) {
          this.store.update(setActiveEnvironmentAction(openedEnvironment.uuid));

          return false;
        }

        return true;
      }),
      switchMap((filePath) =>
        this.storageService.loadEnvironment(filePath).pipe(
          switchMap((environment) => this.verifyData(environment)),
          tap((environment) => {
            this.validateAndAddToStore(environment, filePath);
          })
        )
      )
    );
  }

  /**
   * Close an environment (or the current one) and update the settings
   *
   * @param environmentUUID
   */
  public closeEnvironment(
    environmentUUID: string = this.store.get('activeEnvironmentUUID')
  ): Observable<boolean> {
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
   * Add a new route and save it in the store
   */
  public addRoute() {
    if (this.store.getActiveEnvironment()) {
      this.store.update(addRouteAction(BuildRoute()));
      this.uiService.scrollRoutesMenu.next(ScrollDirection.BOTTOM);
      this.uiService.focusInput(FocusableInputs.ROUTE_PATH);
    }
  }

  /**
   * Add a new databucket and save it in the store
   */
  public addDatabucket() {
    if (this.store.getActiveEnvironment()) {
      console.log('enter services');
      this.store.update(addDatabucketAction(BuildDatabucket()));
      this.uiService.scrollRoutesMenu.next(ScrollDirection.BOTTOM);
      this.uiService.focusInput(FocusableInputs.DATABUCKET_NAME);
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
          this.store.update(addRouteAction(route));

          return EMPTY;
        } else {
          return this.addEnvironment({
            ...BuildEnvironment({
              hasDefaultHeader: true,
              hasDefaultRoute: true,
              port: this.dataService.getNewEnvironmentPort()
            }),
            routes: [route]
          });
        }
      }),
      tap(() => {
        this.uiService.scrollRoutesMenu.next(ScrollDirection.BOTTOM);
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
    this.store.update(addRouteResponseAction(BuildRouteResponse()));
  }

  /**
   * Set active databucket by UUID
   */
  public setActiveDatabucket(databucketUUID: string | ReducerDirectionType) {
    const activeDatabucketUUID = this.store.get('activeDatabucketUUID');

    if (activeDatabucketUUID && activeDatabucketUUID !== databucketUUID) {
      this.store.update(setActiveDatabucketAction(databucketUUID));
    }
  }
  /**
   * Duplicate the given route response and save it in the store
   */
  public duplicateRouteResponse() {
    const activeRouteResponse = this.store.getActiveRouteResponse();
    this.store.update(
      addRouteResponseAction(CloneRouteResponse(activeRouteResponse), true)
    );
  }

  /**
   * Duplicate a route, or the current active route and append it at the end
   */
  public duplicateRoute(routeUUID?: string) {
    let routeToDuplicate = this.store.getActiveRoute();

    if (routeUUID) {
      routeToDuplicate = this.store
        .getActiveEnvironment()
        .routes.find((route) => route.uuid === routeUUID);
    }

    if (routeToDuplicate) {
      let newRoute: Route = CloneObject(routeToDuplicate);

      newRoute = this.dataService.renewRouteUUIDs(newRoute);

      this.store.update(addRouteAction(newRoute, routeToDuplicate.uuid));
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
      const newRoute: Route = this.dataService.renewRouteUUIDs(
        CloneObject(routeToDuplicate)
      );
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
  public duplicateDatabucket(databucketUUID?: string) {
    let databucketToDuplicate = this.store.getActiveDatabucket();

    if (databucketUUID) {
      databucketToDuplicate = this.store
        .getActiveEnvironment()
        .data.find((data) => data.uuid === databucketUUID);
    }

    if (databucketToDuplicate) {
      let newDatabucket: DataBucket = CloneObject(databucketToDuplicate);

      newDatabucket = this.dataService.renewDatabucketUUIDs(newDatabucket);

      this.store.update(
        addDatabucketAction(newDatabucket, databucketToDuplicate.uuid)
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
      const newDatabucket: DataBucket = this.dataService.renewDatabucketUUIDs(
        CloneObject(databucketToDuplicate)
      );
      this.store.update(
        duplicateDatabucketToAnotherEnvironmentAction(
          newDatabucket,
          targetEnvironmentUUID
        )
      );
    }
  }

  /**
   * Remove a route and save
   */
  public removeRoute(routeUUID: string = this.store.get('activeRouteUUID')) {
    if (routeUUID) {
      this.store.update(removeRouteAction(routeUUID));
    }
  }

  /**
   * Remove current route response and save
   */
  public removeRouteResponse() {
    this.store.update(removeRouteResponseAction());
  }

  /**
   * Remove a databucket and save
   */
  public removeDatabucket(
    databucketUUID: string = this.store.get('activeDatabucketUUID')
  ) {
    if (databucketUUID) {
      this.store.update(removeDatabucketAction(databucketUUID));
    }
  }

  /**
   * Enable and disable a route
   */
  public toggleRoute(routeUUID?: string) {
    const selectedRoute = this.store
      .getActiveEnvironment()
      .routes.find((route) => route.uuid === routeUUID);
    if (selectedRoute) {
      this.store.update(
        updateRouteAction({
          uuid: selectedRoute.uuid,
          enabled: !selectedRoute.enabled
        })
      );
    }
  }

  /**
   * Set active tab
   */
  public setActiveTab(activeTab: TabsNameType) {
    this.store.update(setActiveTabAction(activeTab));
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
  public updateActiveEnvironment(properties: EnvironmentProperties) {
    this.store.update(updateEnvironmentAction(properties));
  }

  /**
   * Update the active route
   */
  public updateActiveRoute(properties: RouteProperties) {
    this.store.update(updateRouteAction(properties));
  }

  /**
   * Update the active route response
   */
  public updateActiveRouteResponse(properties: RouteResponseProperties) {
    this.store.update(updateRouteResponseAction(properties));
  }

  /**
   * Update the active databucket
   */
  public updateActiveDatabucket(properties: DatabucketProperties) {
    this.store.update(updateDatabucketAction(properties));
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
    const activeEnvironmentState = environmentsStatus[environment.uuid];

    if (activeEnvironmentState.running) {
      this.serverService.stop(environment.uuid);

      if (activeEnvironmentState.needRestart) {
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
      (uuid) =>
        !environmentsStatus[uuid].running ||
        environmentsStatus[uuid].needRestart
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
   * Move a menu item (envs / routes)
   */
  public moveMenuItem(
    type: DraggableContainerNames,
    sourceIndex: number,
    targetIndex: number
  ) {
    const storeActions = {
      routes: moveRoutesAction,
      databuckets: moveDatabucketsAction,
      environments: moveEnvironmentsAction,
      routeResponses: moveRouteResponsesAction
    };

    this.store.update(storeActions[type]({ sourceIndex, targetIndex }));
  }

  /**
   * Create a route based on a environment log entry
   */
  public createRouteFromLog(logUUID?: string) {
    const environmentsLogs = this.store.get('environmentsLogs');
    const uuidEnvironment = this.store.get('activeEnvironmentUUID');
    const log = environmentsLogs[uuidEnvironment].find(
      (environmentLog) => environmentLog.UUID === logUUID
    );

    if (log) {
      let routeResponse: RouteResponse;

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

      const prefix = this.store.getActiveEnvironment().endpointPrefix;
      let endpoint = log.url.slice(1); // Remove the initial slash '/'
      if (prefix && endpoint.startsWith(prefix)) {
        endpoint = endpoint.slice(prefix.length + 1); // Remove the prefix and the slash
      }

      const newRoute: Route = {
        ...BuildRoute(),
        method: log.method,
        endpoint,
        responses: [routeResponse]
      };

      this.store.update(addRouteAction(newRoute));
    }
  }

  /**
   * Sends an event for further process of entity movement
   */
  public startEntityDuplicationToAnotherEnvironment(
    subjectUUID: string,
    subject: string
  ) {
    this.store.update(
      startEntityDuplicationToAnotherEnvironmentAction(subjectUUID, subject)
    );
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
   * Copy an environment JSON to the clipboard
   *
   * @param environmentUUID
   */
  public copyEnvironmentToClipboard(environmentUUID: string) {
    this.logMessage('info', 'COPY_ENVIRONMENT_CLIPBOARD', {
      environmentUUID
    });

    const environment = this.store.getEnvironmentByUUID(environmentUUID);

    try {
      MainAPI.send('APP_WRITE_CLIPBOARD', JSON.stringify(environment, null, 4));

      this.logMessage('info', 'COPY_ENVIRONMENT_CLIPBOARD_SUCCESS', {
        environmentUUID
      });
    } catch (error) {
      this.logMessage('error', 'COPY_ENVIRONMENT_CLIPBOARD_ERROR', {
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
    this.logMessage('info', 'COPY_ENVIRONMENT_CLIPBOARD', {
      routeUUID
    });

    const route = this.store.getRouteByUUID(routeUUID);

    try {
      MainAPI.send('APP_WRITE_CLIPBOARD', JSON.stringify(route, null, 4));

      this.logMessage('info', 'COPY_ROUTE_CLIPBOARD_SUCCESS', {
        routeUUID
      });
    } catch (error) {
      this.logMessage('error', 'COPY_ROUTE_CLIPBOARD_ERROR', {
        error
      });
    }
  }

  /**
   * Verify data is not too recent or is a mockoon file.
   * To be used in switchMap mostly.
   *
   * @param environment
   * @returns
   */
  private verifyData(environment: Environment): Observable<Environment> {
    if (environment.lastMigration > HighestMigrationId) {
      this.logMessage('info', 'ENVIRONMENT_MORE_RECENT_VERSION', {
        name: environment.name,
        uuid: environment.uuid
      });

      return EMPTY;
    }

    if (IsLegacyExportData(environment)) {
      const confirmImport$ = new Subject<boolean>();

      this.eventsService.confirmModalEvents.next({
        title: 'Legacy export format detected',
        text: 'This content seems to be in an old export format.',
        sub: 'Mockoon will attempt to migrate the content, which may be altered and overwritten.',
        subIcon: 'warning',
        subIconClass: 'text-warning',
        confirmed$: confirmImport$
      });

      return confirmImport$.pipe(
        switchMap((confirmed) => {
          if (confirmed) {
            const unwrappedEnvironments = UnwrapLegacyExport(environment);

            if (unwrappedEnvironments.length) {
              return of(unwrappedEnvironments[0]);
            }
          }

          return EMPTY;
        })
      );
    }

    if (environment.lastMigration === undefined) {
      const confirmed$ = new Subject<boolean>();

      this.eventsService.confirmModalEvents.next({
        title: 'Confirm opening',
        text: 'This content does not seem to be a valid Mockoon environment. Open it anyway?',
        sub: 'Mockoon will attempt to migrate and repair the content, which may be altered and overwritten.',
        subIcon: 'warning',
        subIconClass: 'text-warning',
        confirmed$
      });

      return confirmed$.pipe(
        switchMap((confirmed) => (confirmed ? of(environment) : EMPTY))
      );
    }

    return of(environment);
  }

  /**
   * Validate/migrate and add the environment to the store.
   *
   * @param environment
   * @param filePath
   */
  private validateAndAddToStore(environment: Environment, filePath: string) {
    const validatedEnvironment =
      this.dataService.migrateAndValidateEnvironment(environment);

    this.store.update(
      addEnvironmentAction(validatedEnvironment, {
        filePath
      })
    );

    this.uiService.scrollEnvironmentsMenu.next(ScrollDirection.BOTTOM);
  }
}
