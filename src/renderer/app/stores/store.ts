import { Injectable } from '@angular/core';
import {
  Environment,
  Environments,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { INDENT_SIZE } from 'src/renderer/app/constants/common.constants';
import {
  ActiveEnvironmentsLogUUIDs,
  EnvironmentLog,
  EnvironmentLogs
} from 'src/renderer/app/models/environment-logs.model';
import { Settings } from 'src/renderer/app/models/settings.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { Actions } from 'src/renderer/app/stores/actions';
import { environmentReducer } from 'src/renderer/app/stores/reducer';

export type ViewsNameType = 'ROUTE' | 'ENV_SETTINGS' | 'ENV_LOGS';

export type TabsNameType = 'RESPONSE' | 'HEADERS' | 'RULES' | 'SETTINGS';

export type EnvironmentLogsTabsNameType = 'REQUEST' | 'RESPONSE';

export type EnvironmentStatus = {
  running: boolean;
  needRestart: boolean;
  disabledForIncompatibility: boolean;
};

export type EnvironmentStatusProperties = {
  [T in keyof EnvironmentStatus]?: EnvironmentStatus[T];
};

export type EnvironmentsStatuses = { [key: string]: EnvironmentStatus };

export type DuplicatedRoutesTypes = { [key: string]: Set<string> };

export type UIState = {
  environmentsMenuOpened: boolean;
  appClosing: boolean;
};

export type UIStateProperties = { [T in keyof UIState]?: UIState[T] };

export type DuplicateRouteToAnotherEnvironment = {
  moving: boolean;
  routeUUID?: string;
  targetEnvironmentUUID?: string;
};

export type StoreType = {
  activeTab: TabsNameType;
  activeView: ViewsNameType;
  activeEnvironmentLogsTab: EnvironmentLogsTabsNameType;
  activeEnvironmentUUID: string;
  activeRouteUUID: string;
  activeRouteResponseUUID: string;
  environments: Environments;
  environmentsStatus: EnvironmentsStatuses;
  bodyEditorConfig: any;
  duplicatedEnvironments: Set<string>;
  duplicatedRoutes: DuplicatedRoutesTypes;
  environmentsLogs: EnvironmentLogs;
  // the active log UUID per environment
  activeEnvironmentLogsUUID: ActiveEnvironmentsLogUUIDs;
  toasts: Toast[];
  uiState: UIState;
  settings: Settings;
  duplicateRouteToAnotherEnvironment: DuplicateRouteToAnotherEnvironment;
  routesFilter: string;
};

@Injectable({ providedIn: 'root' })
export class Store {
  private store$ = new BehaviorSubject<StoreType>({
    activeView: 'ROUTE',
    activeTab: 'RESPONSE',
    activeEnvironmentLogsTab: 'REQUEST',
    activeEnvironmentLogsUUID: {},
    activeEnvironmentUUID: null,
    activeRouteUUID: null,
    activeRouteResponseUUID: null,
    environments: [],
    environmentsStatus: {},
    bodyEditorConfig: {
      options: {
        fontSize: '1rem',
        wrap: 'free',
        showPrintMargin: false,
        tooltipFollowsMouse: false,
        useWorker: false,
        tabSize: INDENT_SIZE
      },
      mode: 'json',
      theme: 'editor-theme'
    },
    duplicatedEnvironments: new Set(),
    duplicatedRoutes: {},
    environmentsLogs: {},
    toasts: [],
    uiState: {
      environmentsMenuOpened: false,
      appClosing: false
    },
    settings: null,
    duplicateRouteToAnotherEnvironment: { moving: false },
    routesFilter: ''
  });

  constructor() {}

  /**
   * Select store element
   */
  public select<T extends keyof StoreType>(path: T): Observable<StoreType[T]> {
    return this.store$.asObservable().pipe(pluck(path));
  }

  /**
   * Get any store item
   */
  public get<T extends keyof StoreType>(path: T): StoreType[T] {
    return this.store$.value[path];
  }

  /**
   * Select active environment observable
   */
  public selectActiveEnvironment(): Observable<Environment> {
    return this.store$
      .asObservable()
      .pipe(
        map((store) =>
          store.environments.find(
            (environment) => environment.uuid === store.activeEnvironmentUUID
          )
        )
      );
  }

  /**
   * Select active environment property observable
   */
  public selectActiveEnvironmentProperty<T extends keyof Environment>(
    path: T
  ): Observable<Environment[T]> {
    return this.selectActiveEnvironment().pipe(pluck(path));
  }

  /**
   * Select active environment status observable
   */
  public selectActiveEnvironmentStatus(): Observable<EnvironmentStatus> {
    return this.store$
      .asObservable()
      .pipe(
        map(
          (store: StoreType) =>
            store.environmentsStatus[store.activeEnvironmentUUID]
        )
      );
  }

  /**
   * Select active environment logs
   */
  public selectActiveEnvironmentLogs(): Observable<EnvironmentLog[]> {
    return this.store$
      .asObservable()
      .pipe(
        map((store) => store.environmentsLogs[store.activeEnvironmentUUID])
      );
  }

  /**
   * Select active environment log UUID for selected environment
   */
  public selectActiveEnvironmentLogUUID(): Observable<string> {
    return this.store$
      .asObservable()
      .pipe(
        map(
          (store) =>
            store.activeEnvironmentLogsUUID[store.activeEnvironmentUUID]
        )
      );
  }

  /**
   * Select last environment log for active route response
   */
  public selectActiveRouteResponseLastLog(): Observable<EnvironmentLog> {
    return this.store$
      .asObservable()
      .pipe(
        map((store) =>
          store.activeEnvironmentUUID
            ? store.environmentsLogs[store.activeEnvironmentUUID].find(
                (environmentLog) =>
                  environmentLog.routeUUID === store.activeRouteUUID &&
                  environmentLog.routeResponseUUID ===
                    store.activeRouteResponseUUID
              )
            : null
        )
      );
  }

  /**
   * Select active route observable
   */
  public selectActiveRoute(): Observable<Route> {
    return this.selectActiveEnvironment().pipe(
      map((environment) =>
        environment
          ? environment.routes.find(
              (route) => route.uuid === this.store$.value.activeRouteUUID
            )
          : null
      )
    );
  }

  /**
   * Select active route response observable
   */
  public selectActiveRouteResponse(): Observable<RouteResponse> {
    return this.selectActiveRoute().pipe(
      map((route) =>
        route
          ? route.responses.find(
              (routeResponse) =>
                routeResponse.uuid === this.store$.value.activeRouteResponseUUID
            )
          : null
      )
    );
  }

  /**
   * Select active route response index observable
   */
  public selectActiveRouteResponseIndex(): Observable<number> {
    return this.selectActiveRoute().pipe(
      map((route) =>
        route
          ? route.responses.findIndex(
              (routeResponse) =>
                routeResponse.uuid === this.store$.value.activeRouteResponseUUID
            ) + 1
          : null
      )
    );
  }

  /**
   * Get environment by uuid
   */
  public getEnvironmentByUUID(UUID: string): Environment {
    return this.store$.value.environments.find(
      (environment) => environment.uuid === UUID
    );
  }

  /**
   * Get active environment value
   */
  public getActiveEnvironment(): Environment {
    return this.store$.value.environments.find(
      (environment) =>
        environment.uuid === this.store$.value.activeEnvironmentUUID
    );
  }

  /**
   * Get environments status value
   */
  public getEnvironmentStatus(): EnvironmentsStatuses {
    return this.store$.value.environmentsStatus;
  }

  /**
   * Get active route value
   */
  public getActiveRoute(): Route {
    const activeEnvironment = this.store$.value.environments.find(
      (environment) =>
        environment.uuid === this.store$.value.activeEnvironmentUUID
    );

    if (!activeEnvironment) {
      return null;
    }

    return activeEnvironment.routes.find(
      (route) => route.uuid === this.store$.value.activeRouteUUID
    );
  }

  /**
   * Get active route response value
   */
  public getActiveRouteResponse(): RouteResponse {
    return this.store$.value.environments
      .find(
        (environment) =>
          environment.uuid === this.store$.value.activeEnvironmentUUID
      )
      .routes.find((route) => route.uuid === this.store$.value.activeRouteUUID)
      .responses.find(
        (response) =>
          response.uuid === this.store$.value.activeRouteResponseUUID
      );
  }

  /**
   * Get route with the supplied UUID from any environment
   */
  public getRouteByUUID(routeUUID: string): Route | undefined {
    let foundRoute: Route;
    this.store$.value.environments.some((environment: Environment) => {
      foundRoute = environment.routes.find(
        (route: Route) => route.uuid === routeUUID
      );

      return !!foundRoute;
    });

    return foundRoute;
  }

  /**
   * Update the store using the reducer
   */
  public update(action: Actions) {
    this.store$.next(environmentReducer(this.store$.value, action));
  }

  /**
   * Get a list with all environment ports
   */
  public getEnvironmentsPorts(): number[] {
    return this.store$.value.environments.reduce((list, env) => {
      list.push(env.port);

      return list;
    }, []);
  }
}
