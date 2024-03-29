import { Injectable } from '@angular/core';
import {
  Callback,
  DataBucket,
  Environment,
  Route,
  RouteResponse
} from '@mockoon/commons';
import {
  BehaviorSubject,
  MonoTypeOperatorFunction,
  Observable,
  pipe
} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  withLatestFrom
} from 'rxjs/operators';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import {
  CallbackSpecTabNameType,
  CallbackTabsNameType
} from 'src/renderer/app/models/callback.model';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
import {
  EnvironmentStatus,
  StoreType
} from 'src/renderer/app/models/store.model';
import { ActionTypes, Actions } from 'src/renderer/app/stores/actions';
import { environmentReducer } from 'src/renderer/app/stores/reducer';

@Injectable({ providedIn: 'root' })
export class Store {
  private store$ = new BehaviorSubject<StoreType>({
    activeView: 'ENV_ROUTES',
    activeTab: 'RESPONSE',
    activeEnvironmentLogsTab: 'REQUEST',
    activeTemplatesTab: 'LIST',
    activeEnvironmentLogsUUID: {},
    activeEnvironmentUUID: null,
    activeRouteUUID: null,
    activeDatabucketUUID: null,
    activeCallbackUUID: null,
    activeRouteResponseUUID: null,
    environments: [],
    environmentsStatus: {},
    bodyEditorConfig: defaultEditorOptions,
    duplicatedRoutes: {},
    environmentsLogs: {},
    toasts: [],
    uiState: {
      closing: false,
      saving: false
    },
    settings: null,
    duplicateEntityToAnotherEnvironment: { moving: false },
    filters: {
      routes: '',
      databuckets: '',
      templates: '',
      callbacks: ''
    },
    user: null,
    callbackSettings: {
      activeTab: 'SPEC',
      activeSpecTab: 'BODY'
    },
    sync: {
      status: false,
      presence: null,
      offlineReason: null,
      alert: null
    }
  });
  /**
   * Emits latest store action
   * Most views are updating the store by themselves and only listen for UUID changes to update their view. Sometimes, a view update is needed when the store is updated by another view, or when the store is updated by an external source (liek file monitoring).
   * Some actions are forcing a UI refresh, and it's also possible to force a UI refresh manually by emitting a new action with the force property set to true (e.g. environments menu name edit need to update the settings view when it's opened)
   */
  private storeAction$ = new BehaviorSubject<{
    payload: Actions;
    force: boolean;
    emit: boolean;
  }>(null);

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
   * Select a filter
   */
  public selectFilter<T extends keyof StoreType['filters']>(
    filterText: T
  ): Observable<string> {
    return this.store$.asObservable().pipe(
      map((store) => store?.filters[filterText]),
      distinctUntilChanged()
    );
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
            )
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
   * Select active callback observable
   */
  public selectActiveCallback(): Observable<Callback> {
    return this.selectActiveEnvironment().pipe(
      map((environment) =>
        environment
          ? environment.callbacks.find(
              (cb) => cb.uuid === this.store$.value.activeCallbackUUID
            )
          : null
      )
    );
  }

  /**
   * Get the active selected tab of callback view.
   */
  public getSelectedCallbackTab(): CallbackTabsNameType {
    return this.store$.value.callbackSettings.activeTab;
  }

  /**
   * Get the active selected spec tab of callback view.
   */
  public getSelectedSpecTabInCallbackView(): CallbackSpecTabNameType {
    return this.store$.value.callbackSettings.activeSpecTab;
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
   * Get active callback value
   */
  public getActiveCallback(): Callback {
    const activeEnvironment = this.store$.value.environments.find(
      (environment) =>
        environment.uuid === this.store$.value.activeEnvironmentUUID
    );

    if (!activeEnvironment) {
      return null;
    }

    return activeEnvironment.callbacks.find(
      (callback) => callback.uuid === this.store$.value.activeCallbackUUID
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
   * Get callback with the supplied UUID from any environment
   */
  public getCallbackByUUID(callbackUUID: string): Callback | undefined {
    let foundCallback: Callback;
    this.store$.value.environments.some((environment: Environment) => {
      foundCallback = environment.callbacks.find(
        (cb: Callback) => cb.uuid === callbackUUID
      );

      return !!foundCallback;
    });

    return foundCallback;
  }

  /**
   * Update the store using the reducer
   *
   * @param action
   * @param force
   * @param emit - emit the action to the storeAction$ observable
   */
  public update(action: Actions, force = false, emit = true) {
    this.storeAction$.next({ payload: action, force, emit });
    this.store$.next(environmentReducer(this.store$.value, action));
  }

  public getStoreActions() {
    return this.storeAction$
      .asObservable()
      .pipe(filter((action) => action.emit));
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

  /**
   * Custom operator to prevent emitting the same UUID twice except if emit is forced (reducer actions that are external updates, like a refresh)
   *
   */
  public distinctUUIDOrForce<
    T extends { uuid: string }
  >(): MonoTypeOperatorFunction<T> {
    return pipe(
      withLatestFrom(this.storeAction$),
      distinctUntilChanged(
        ([previousObject], [nextObject, nextAction]) =>
          previousObject.uuid === nextObject.uuid &&
          nextAction.payload.type !== ActionTypes.RELOAD_ENVIRONMENT &&
          !nextAction.force
      ),
      map(([object]) => object)
    );
  }
}
