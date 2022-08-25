import { Injectable } from '@angular/core';
import {
  DataBucket,
  Environment,
  INDENT_SIZE,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
import {
  EnvironmentStatus,
  StoreType
} from 'src/renderer/app/models/store.model';
import { Actions } from 'src/renderer/app/stores/actions';
import { environmentReducer } from 'src/renderer/app/stores/reducer';

@Injectable({ providedIn: 'root' })
export class Store {
  private store$ = new BehaviorSubject<StoreType>({
    activeView: 'ENV_ROUTES',
    activeTab: 'RESPONSE',
    activeEnvironmentLogsTab: 'REQUEST',
    activeEnvironmentLogsUUID: {},
    activeEnvironmentUUID: null,
    activeRouteUUID: null,
    activeDatabucketUUID: null,
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
        tabSize: INDENT_SIZE,
        enableBasicAutocompletion: [
          {
            getCompletions: (editor, session, pos, prefix, callback) => {
              // note, won't fire if caret is at a word that does not have these letters
              callback(null, [
                {
                  caption: 'data ID',
                  value: "{{data 'id'}}",
                  meta: 'Get databucket by ID'
                },
                {
                  caption: 'data name',
                  value: "{{data 'bucketName'}}",
                  meta: 'Get databucket by name or partial name'
                }
              ]);
            }
          }
        ]
      },
      mode: 'json',
      theme: 'editor-theme'
    },
    duplicatedRoutes: {},
    environmentsLogs: {},
    toasts: [],
    uiState: {
      closing: false,
      saving: false
    },
    settings: null,
    duplicateEntityToAnotherEnvironment: { moving: false },
    routesFilter: '',
    databucketsFilter: ''
  });

  constructor() {}

  /**
   * Select store element
   */
  public select<T extends keyof StoreType>(path: T): Observable<StoreType[T]> {
    return this.store$.asObservable().pipe(
      map((store) => store?.[path]),
      distinctUntilChanged()
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
    return this.selectActiveEnvironment().pipe(
      map((activeEnvironment) => activeEnvironment?.[path])
    );
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
   * Select active databucket observable
   */
  public selectActiveDatabucket(): Observable<DataBucket> {
    return this.selectActiveEnvironment().pipe(
      map((environment) =>
        environment
          ? environment.data.find(
              (data) => data.uuid === this.store$.value.activeDatabucketUUID
            )
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
   * Get an environment status value
   */
  public getEnvironmentStatus(environmentUUID: string): EnvironmentStatus {
    return this.store$.value.environmentsStatus[environmentUUID];
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
   * Get active databucket value
   */
  public getActiveDatabucket(): DataBucket {
    const activeEnvironment = this.store$.value.environments.find(
      (environment) =>
        environment.uuid === this.store$.value.activeEnvironmentUUID
    );

    if (!activeEnvironment) {
      return null;
    }

    return activeEnvironment.data.find(
      (databucket) => databucket.uuid === this.store$.value.activeDatabucketUUID
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
   * Get databucket with the supplied UUID from any environment
   */
  public getDatabucketByUUID(databucketUUID: string): DataBucket | undefined {
    let foundDataBucket: DataBucket;
    this.store$.value.environments.some((environment: Environment) => {
      foundDataBucket = environment.data.find(
        (dataBucket: DataBucket) => dataBucket.uuid === databucketUUID
      );

      return !!foundDataBucket;
    });

    return foundDataBucket;
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

  public getEnvironmentPath(environmentUUID: string): string {
    return this.store$.value.settings.environments.find(
      (descriptor) => descriptor.uuid === environmentUUID
    ).path;
  }
}
