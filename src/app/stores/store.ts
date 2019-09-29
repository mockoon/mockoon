import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { Settings } from 'src/app/services/settings.service';
import { Toast } from 'src/app/services/toasts.service';
import { Actions } from 'src/app/stores/actions';
import { environmentReducer } from 'src/app/stores/reducer';
import { Environment, Environments } from 'src/app/types/environment.type';
import { Route, RouteResponse } from 'src/app/types/route.type';
import { EnvironmentLogs } from 'src/app/types/server.type';

export type ViewsNameType = 'ROUTE' | 'ENV_SETTINGS' | 'ENV_LOGS';

export type TabsNameType = 'RESPONSE' | 'HEADERS' | 'RULES';

export type EnvironmentLogsTabsNameType = 'REQUEST' | 'RESPONSE';

export type EnvironmentStatus = { running: boolean, needRestart: boolean };

export type EnvironmentStatusProperties = { [T in keyof EnvironmentStatus]?: EnvironmentStatus[T] };

export type EnvironmentsStatuses = { [key: string]: EnvironmentStatus };

export type DuplicatedRoutesTypes = { [key: string]: Set<string> };

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
  toasts: Toast[];
  userId: string;
  settings: Settings;
};

@Injectable({ providedIn: 'root' })
export class Store {
  private store$ = new BehaviorSubject<StoreType>({
    activeView: 'ROUTE',
    activeTab: 'RESPONSE',
    activeEnvironmentLogsTab: 'REQUEST',
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
        useWorker: false
      },
      mode: 'json',
      theme: 'custom_theme'
    },
    duplicatedEnvironments: new Set(),
    duplicatedRoutes: {},
    environmentsLogs: {},
    toasts: [],
    userId: null,
    settings: null
  });

  constructor() { }

  /**
   * Select store element
   */
  public select<T extends keyof StoreType>(path: T): Observable<StoreType[T]> {
    return this.store$.asObservable().pipe(
      pluck(path)
    );
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
    return this.store$.asObservable().pipe(
      map(store => store.environments.find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID))
    );
  }

  /**
   * Select active environment status observable
   */
  public selectActiveEnvironmentStatus(): Observable<EnvironmentStatus> {
    return this.store$.asObservable().pipe(
      map(store => store.environmentsStatus[this.store$.value.activeEnvironmentUUID])
    );
  }

  /**
   * Select active route observable
   */
  public selectActiveRoute(): Observable<Route> {
    return this.store$.asObservable().pipe(
      map(store => store.environments.find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID)),
      map(environment => environment ? environment.routes.find(route => route.uuid === this.store$.value.activeRouteUUID) : null)
    );
  }

  /**
   * Select active route response observable
   */
  public selectActiveRouteResponse(): Observable<RouteResponse> {
    return this.store$.asObservable().pipe(
      map(store => store.environments.find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID)),
      map(environment => environment ? environment.routes.find(route => route.uuid === this.store$.value.activeRouteUUID) : null),
      map(route => route ? route.responses.find(routeResponse => routeResponse.uuid === this.store$.value.activeRouteResponseUUID) : null)
    );
  }

  /**
   * Select active route response index observable
   */
  public selectActiveRouteResponseIndex(): Observable<number> {
    return this.store$.asObservable().pipe(
      map(store => store.environments.find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID)),
      map(environment => environment ? environment.routes.find(route => route.uuid === this.store$.value.activeRouteUUID) : null),
      map(route => route ? route.responses.findIndex(routeResponse => routeResponse.uuid === this.store$.value.activeRouteResponseUUID) + 1 : null)
    );
  }

  /**
   * Get environment by uuid
   */
  public getEnvironmentByUUID(UUID: string): Environment {
    return this.store$.value.environments.find(environment => environment.uuid === UUID);
  }

  /**
   * Get active environment value
   */
  public getActiveEnvironment(): Environment {
    return this.store$.value.environments.find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID);
  }

  /**
   * Get active route observable
   */
  public getActiveRoute(): Route {
    return this.store$.value.environments
      .find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID).routes
      .find(route => route.uuid === this.store$.value.activeRouteUUID);
  }

  /**
   * Get active route response observable
   */
  public getActiveRouteResponse(): RouteResponse {
    return this.store$.value.environments
      .find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID).routes
      .find(route => route.uuid === this.store$.value.activeRouteUUID).responses
      .find(response => response.uuid === this.store$.value.activeRouteResponseUUID);
  }

  /**
   * Update the store using the reducer
   */
  public update(action: Actions) {
    this.store$.next(environmentReducer(this.store$.value, action));
  }
}
