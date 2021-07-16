import { Injectable } from '@angular/core';
import {
  Environment,
  Environments,
  Header,
  Method,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { cloneDeep } from 'lodash';
import { of } from 'rxjs';
import { concatMap, debounceTime, mergeMap, tap } from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { AnalyticsEvents } from 'src/renderer/app/enums/analytics-events.enum';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { EnvironmentProperties } from 'src/renderer/app/models/environment.model';
import {
  RouteProperties,
  RouteResponseProperties
} from 'src/renderer/app/models/route.model';
import {
  DraggableContainerNames,
  ScrollDirection
} from 'src/renderer/app/models/ui.model';
import { DataService } from 'src/renderer/app/services/data.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { MigrationService } from 'src/renderer/app/services/migration.service';
import { SchemasBuilderService } from 'src/renderer/app/services/schemas-builder.service';
import { ServerService } from 'src/renderer/app/services/server.service';
import { StorageService } from 'src/renderer/app/services/storage.service';
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
  setInitialEnvironmentsAction,
  startRouteDuplicationToAnotherEnvironmentAction,
  updateEnvironmentAction,
  updateRouteAction,
  updateRouteResponseAction
} from 'src/renderer/app/stores/actions';
import { ReducerDirectionType } from 'src/renderer/app/stores/reducer';
import {
  EnvironmentLogsTabsNameType,
  Store,
  TabsNameType,
  ViewsNameType
} from 'src/renderer/app/stores/store';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentsService {
  private storageKey = 'environments';
  private logger = new Logger('[SERVICE][ENVIRONMENTS]');

  constructor(
    private dataService: DataService,
    private eventsService: EventsService,
    private store: Store,
    private serverService: ServerService,
    private migrationService: MigrationService,
    private schemasBuilderService: SchemasBuilderService,
    private uiService: UIService,
    private storageService: StorageService
  ) {
    // get existing environments from storage or create default one, start saving after loading the data
    this.storageService
      .loadData<Environments>(this.storageKey)
      .pipe(
        mergeMap((environments) => {
          if (
            Object.keys(environments).length === 0 &&
            environments.constructor === Object
          ) {
            this.logger.info('No Data, building default environment');

            return of([this.schemasBuilderService.buildDefaultEnvironment()]);
          } else {
            return this.migrationService.migrateEnvironments(environments);
          }
        }),
        tap((environments) => {
          this.store.update(setInitialEnvironmentsAction(environments));
        }),
        concatMap(() =>
          this.storageService.saveData<Environments>(
            this.store.select('environments').pipe(
              debounceTime(100),
              tap((environments) => {
                MainAPI.send('APP_UPDATE_ENVIRONMENT', environments);
              })
            ),
            'environments',
            2000
          )
        )
      )
      .subscribe();
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
   * Add a new environment and save it in the store
   */
  public addEnvironment() {
    this.store.update(
      addEnvironmentAction(this.schemasBuilderService.buildEnvironment())
    );
    this.eventsService.analyticsEvents.next(AnalyticsEvents.CREATE_ENVIRONMENT);
  }

  /**
   * Duplicate an environment, or the active environment and append it at the end of the list.
   */
  public duplicateEnvironment(environmentUUID?: string) {
    let environmentToDuplicate = this.store.getActiveEnvironment();

    if (environmentUUID) {
      environmentToDuplicate = this.store
        .get('environments')
        .find((environment) => environment.uuid === environmentUUID);
    }

    if (environmentToDuplicate) {
      // copy the environment, reset some properties and change name
      let newEnvironment: Environment = {
        ...cloneDeep(environmentToDuplicate),
        name: `${environmentToDuplicate.name} (copy)`,
        port: this.dataService.getNewEnvironmentPort()
      };

      newEnvironment = this.dataService.renewEnvironmentUUIDs(newEnvironment);

      this.store.update(
        addEnvironmentAction(newEnvironment, environmentToDuplicate.uuid)
      );
    }
  }

  /**
   * Remove an environment or the current one if not environmentUUID is provided
   */
  public removeEnvironment(
    environmentUUID: string = this.store.get('activeEnvironmentUUID')
  ) {
    if (environmentUUID) {
      this.serverService.stop(environmentUUID);

      this.store.update(removeEnvironmentAction(environmentUUID));
    }
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

    if (!activeEnvironment) {
      return;
    }

    const environmentsStatus = this.store.get('environmentsStatus');
    const activeEnvironmentState = environmentsStatus[activeEnvironment.uuid];

    if (activeEnvironmentState.running) {
      this.serverService.stop(activeEnvironment.uuid);

      if (activeEnvironmentState.needRestart) {
        this.serverService.start(activeEnvironment);
      }
    } else {
      this.serverService.start(activeEnvironment);
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

      if (shouldStart) {
        if (!environmentState.running || environmentState.needRestart) {
          // if needs restart, we need to stop first to prevent EADDRINUSE errors
          if (environmentState.needRestart) {
            this.serverService.stop(environment.uuid);
          }

          this.serverService.start(environment);
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
}
