import { Injectable } from '@angular/core';
import {
  Environment,
  EnvironmentDefault,
  Header,
  HighestMigrationId,
  Method,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { cloneDeep } from 'lodash';
import { EMPTY, forkJoin, from, Observable, of, throwError, zip } from 'rxjs';
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
import { AnalyticsEvents } from 'src/renderer/app/enums/analytics-events.enum';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { HumanizeText } from 'src/renderer/app/libs/utils.lib';
import { EnvironmentProperties } from 'src/renderer/app/models/environment.model';
import { MessageCodes } from 'src/renderer/app/models/messages.model';
import {
  RouteProperties,
  RouteResponseProperties
} from 'src/renderer/app/models/route.model';
import {
  DraggableContainerNames,
  ScrollDirection
} from 'src/renderer/app/models/ui.model';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { SchemasBuilderService } from 'src/renderer/app/services/schemas-builder.service';
import { ServerService } from 'src/renderer/app/services/server.service';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import {
  addEnvironmentAction,
  addRouteAction,
  addRouteResponseAction,
  duplicateRouteToAnotherEnvironmentAction,
  moveEnvironmentsAction,
  moveRouteResponsesAction,
  moveRoutesAction,
  navigateEnvironmentsAction,
  navigateRoutesAction,
  removeEnvironmentAction,
  removeRouteAction,
  removeRouteResponseAction,
  setActiveEnvironmentAction,
  setActiveEnvironmentLogTabAction,
  setActiveEnvironmentLogUUIDAction,
  setActiveRouteAction,
  setActiveRouteResponseAction,
  setActiveTabAction,
  setActiveViewAction,
  startRouteDuplicationToAnotherEnvironmentAction,
  updateEnvironmentAction,
  updateRouteAction,
  updateRouteResponseAction,
  updateSettingsAction,
  updateUIStateAction
} from 'src/renderer/app/stores/actions';
import { ReducerDirectionType } from 'src/renderer/app/stores/reducer';
import {
  EnvironmentLogsTabsNameType,
  Store,
  TabsNameType,
  ViewsNameType
} from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';
import { EnvironmentDescriptor } from 'src/shared/models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentsService extends Logger {
  constructor(
    private dataService: DataService,
    private eventsService: EventsService,
    private store: Store,
    private serverService: ServerService,
    private schemasBuilderService: SchemasBuilderService,
    private uiService: UIService,
    private storageService: StorageService,
    private dialogsService: DialogsService,
    protected toastService: ToastsService
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

          const defaultEnvironment =
            this.schemasBuilderService.buildDemoEnvironment();

          return of([
            {
              environment: defaultEnvironment,
              path: demoFilePath
            }
          ]);
        }

        return forkJoin(
          settings.environments.map((environmentItem) =>
            this.storageService
              .loadData<Environment>(null, environmentItem.path)
              .pipe(
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
      // keep previously emitted environments and filter environments that didn't change (startwith + pairwise + map)
      startWith([]),
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
            this.storageService.saveData<Environment>(
              null,
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
    afterUUID?: string
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
          : this.schemasBuilderService.buildEnvironment();

        // if a non-default name has been set already (imports), do not use the filename
        if (newEnvironment.name === EnvironmentDefault.name) {
          newEnvironment.name = HumanizeText(filename);
        }

        this.store.update(
          addEnvironmentAction(newEnvironment, { filePath, afterUUID })
        );

        this.uiService.scrollEnvironmentsMenu.next(ScrollDirection.BOTTOM);
        this.eventsService.analyticsEvents.next(
          AnalyticsEvents.CREATE_ENVIRONMENT
        );
      })
    );
  }

  /**
   * Duplicate an environment, or the active environment and append it at the end of the list.
   */
  public duplicateEnvironment(
    environmentUUID: string = this.store.get('activeEnvironmentUUID')
  ): Observable<[string, string]> {
    if (environmentUUID) {
      const environmentToDuplicate = this.store
        .get('environments')
        .find((environment) => environment.uuid === environmentUUID);

      // copy the environment, reset some properties and change name
      let newEnvironment: Environment = {
        ...cloneDeep(environmentToDuplicate),
        name: `${environmentToDuplicate.name} (copy)`,
        port: this.dataService.getNewEnvironmentPort()
      };

      newEnvironment = this.dataService.renewEnvironmentUUIDs(newEnvironment);

      return this.addEnvironment(newEnvironment, environmentToDuplicate.uuid);
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
        this.storageService.loadData<Environment>(null, filePath).pipe(
          tap((environment) => {
            if (this.dataService.isExportData(environment)) {
              this.logMessage('info', 'ENVIRONMENT_IS_EXPORT_FILE');

              return;
            }

            if (environment.lastMigration === undefined) {
              this.eventsService.confirmModalEvents.next({
                title: 'Confirm file opening',
                text: 'This file does not seem to be a valid Mockoon file. Open it anyway?',
                sub: 'File content may be overwritten.',
                subIcon: 'warning',
                subIconClass: 'text-warning',
                confirmCallback: () => {
                  this.validateAndAddToStore(environment, filePath);
                }
              });

              return;
            }

            if (environment.lastMigration > HighestMigrationId) {
              this.logMessage('info', 'ENVIRONMENT_MORE_RECENT_VERSION', {
                name: environment.name,
                uuid: environment.uuid
              });

              return;
            }

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
        this.store.update(updateUIStateAction({ closing: true }));
      }),
      filter((saving) => !saving),
      first(),
      tap(() => {
        if (environmentUUID) {
          this.serverService.stop(environmentUUID);

          this.store.update(removeEnvironmentAction(environmentUUID));
        }
        this.store.update(updateUIStateAction({ closing: false }));
      })
    );
  }

  /**
   * Add a new route and save it in the store
   */
  public addRoute() {
    if (this.store.getActiveEnvironment()) {
      this.store.update(
        addRouteAction(this.schemasBuilderService.buildRoute())
      );
      this.eventsService.analyticsEvents.next(AnalyticsEvents.CREATE_ROUTE);
      this.uiService.scrollRoutesMenu.next(ScrollDirection.BOTTOM);
      this.uiService.focusInput(FocusableInputs.ROUTE_PATH);
    }
  }

  /**
   * Add a new route response and save it in the store
   */
  public addRouteResponse() {
    this.store.update(
      addRouteResponseAction(this.schemasBuilderService.buildRouteResponse())
    );
  }

  /**
   * Duplicate the given route response and save it in the store
   */
  public duplicateRouteResponse() {
    const activeRouteResponse = this.store.getActiveRouteResponse();
    this.store.update(
      addRouteResponseAction(
        this.schemasBuilderService.cloneRouteResponse(activeRouteResponse),
        true
      )
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
      let newRoute: Route = cloneDeep(routeToDuplicate);

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
        cloneDeep(routeToDuplicate)
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
   * Start / stop active environment
   */
  public toggleActiveEnvironment() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const environmentPath: EnvironmentDescriptor[] =
      this.store.get('settings').environments;
    const activeEnvironmentPath = environmentPath.find(
      (path) => path.uuid === activeEnvironment.uuid
    ).path;

    if (!activeEnvironment) {
      return;
    }

    const environmentsStatus = this.store.get('environmentsStatus');
    const activeEnvironmentState = environmentsStatus[activeEnvironment.uuid];

    if (activeEnvironmentState.running) {
      this.serverService.stop(activeEnvironment.uuid);

      if (activeEnvironmentState.needRestart) {
        this.serverService.start(activeEnvironment, activeEnvironmentPath);
      }
    } else {
      this.serverService.start(activeEnvironment, activeEnvironmentPath);
      this.eventsService.analyticsEvents.next(AnalyticsEvents.SERVER_START);
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

          headers.push(
            this.schemasBuilderService.buildHeader(header.key, header.value)
          );
        });

        if (log.response.body) {
          headers.push(
            this.schemasBuilderService.buildHeader(
              'content-length',
              log.response.body.length.toString()
            )
          );
        }

        routeResponse = {
          ...this.schemasBuilderService.buildRouteResponse(),
          headers,
          statusCode: log.response.status,
          body: log.response.body
        };
      } else {
        routeResponse = this.schemasBuilderService.buildRouteResponse();
      }

      const prefix = this.store.getActiveEnvironment().endpointPrefix;
      let endpoint = log.url.slice(1); // Remove the initial slash '/'
      if (prefix && endpoint.startsWith(prefix)) {
        endpoint = endpoint.slice(prefix.length + 1); // Remove the prefix and the slash
      }

      const newRoute: Route = {
        ...this.schemasBuilderService.buildRoute(),
        method: log.method.toLowerCase() as Method,
        endpoint,
        responses: [routeResponse]
      };

      this.store.update(addRouteAction(newRoute));

      this.eventsService.analyticsEvents.next(
        AnalyticsEvents.CREATE_ROUTE_FROM_LOG
      );
    }
  }

  /**
   * Sends an event for further process of route movement
   */
  public startRouteDuplicationToAnotherEnvironment(routeUUID: string) {
    this.store.update(
      startRouteDuplicationToAnotherEnvironmentAction(routeUUID)
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
        filePath,
        afterUUID: null
      })
    );
    this.uiService.scrollEnvironmentsMenu.next(ScrollDirection.BOTTOM);
  }
}
