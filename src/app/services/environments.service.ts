import { Injectable } from '@angular/core';
import * as jsonStorage from 'electron-json-storage';
import { Subject } from 'rxjs/Subject';
import { EnvironmentsType, EnvironmentType } from 'app/types/environment.type';
import { RouteType } from 'app/types/route.type';
import { ServerStateEventType } from 'app/types/server.type';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/debounceTime';
import * as uuid from 'uuid/v1';
import * as storage from 'electron-json-storage';
import { ServerService } from 'app/services/server.service';
import { cloneDeep } from 'lodash';


@Injectable()
export class EnvironmentsService {
  public environmentUpdateEvents: Subject<{
    environment: EnvironmentType,
    callback?: Function
  }> = new Subject<{
    environment: EnvironmentType,
    callback?: Function
  }>();
  public environmentsReady: Subject<boolean> = new Subject<boolean>();
  public environments: EnvironmentsType;
  public routesTotal = 0;

  private environmentSchema: EnvironmentType = {
    uuid: '',
    running: false,
    instance: null,
    name: '',
    endpointPrefix: '',
    latency: 0,
    port: 3000,
    routes: [],
    startedAt: null,
    modifiedAt: null,
    duplicates: [],
    needRestart: false,
    proxyMode: false,
    proxyHost: '',
    https: false
  };

  private routeSchema: RouteType = {
    method: 'get',
    endpoint: '',
    contentType: 'text/plain',
    body: 'Environment is running.',
    latency: 0,
    statusCode: '200',
    customHeaders: [],
    file: null,
    duplicates: []
  };

  private storageKey = 'environments';

  constructor(private serverService: ServerService) {
    // get existing environments from storage or default one
    storage.get(this.storageKey, (error, environments) => {
      // if empty object
      if (Object.keys(environments).length === 0 && environments.constructor === Object) {
        // build default starting env
        const defaultEnvironment: EnvironmentType = this.buildDefaultEnvironment();

        this.environments = [defaultEnvironment];
      } else {
        this.environments = this.migrateData(environments);
      }

      this.environmentsReady.next(true);
    });

    // subscribe to environment data update from UI, and save
    this.environmentUpdateEvents.debounceTime(1000).subscribe((params) => {
      storage.set(this.storageKey, this.cleanBeforeSave(this.environments), () => {
        if (params.callback) {
          params.callback();
        }
      });
    });

    // subscribe to environment data update from UI
    this.environmentUpdateEvents.debounceTime(100).subscribe((params) => {
      if (params.environment) {
        this.checkRoutesDuplicates(params.environment);
        this.checkEnvironmentsDuplicates();
      }

      if (params.callback) {
        params.callback();
      }
    });
  }

  /**
   * Add a new environment and save it
   *
   * @param callback - callback to execute after adding the env
   */
  public addEnvironment(callback: Function): number {
    const newRoute = Object.assign({}, this.routeSchema, { customHeaders: [{ uuid: uuid(), key: '', value: '' }] });
    const newEnvironment = Object.assign(
      {},
      this.environmentSchema,
      {
        uuid: uuid(),
        name: 'New environment',
        port: 3000,
        routes: [
          newRoute
        ],
        modifiedAt: new Date()
      }
    );
    this.routesTotal += 1;

    const newEnvironmentIndex = this.environments.push(newEnvironment) - 1;

    this.environmentUpdateEvents.next({ environment: newEnvironment, callback });

    return newEnvironmentIndex;
  }

  /**
   * Add a new route and save it
   *
   * @param environment - environment to which add a route
   */
  public addRoute(environment: EnvironmentType, callback: Function): number {
    const newRoute = Object.assign({}, this.routeSchema, { customHeaders: [{ uuid: uuid(), key: '', value: '' }] });
    const newRouteIndex = environment.routes.push(newRoute) - 1;
    this.routesTotal += 1;

    this.environmentUpdateEvents.next({ environment, callback });

    return newRouteIndex;
  }

  /**
   * Remove a route and save
   *
   * @param environment - environment to which remove a route
   * @param routeIndex - route index to remove
   */
  public removeRoute(environment: EnvironmentType, routeIndex: number, callback: Function) {
    // delete the route
    environment.routes.splice(routeIndex, 1);
    this.routesTotal -= 1;

    this.checkRoutesDuplicates(environment);

    this.environmentUpdateEvents.next({
      environment,
      callback
    });
  }

  /**
   * Remove an environment and save
   *
   * @param environmentIndex - environment index to remove
   */
  public removeEnvironment(environmentIndex: number) {
    // stop if needed before deletion
    if (this.environments[environmentIndex].running) {
      this.serverService.stop(this.environments[environmentIndex]);
    }
    // delete the environment
    this.environments.splice(environmentIndex, 1);

    this.checkEnvironmentsDuplicates();

    this.environmentUpdateEvents.next({
      environment: null,
      callback: null
    });
  }

  /**
   * Build a default environment when starting the application for the first time
   */
  private buildDefaultEnvironment(): EnvironmentType {
    const defaultEnvironment: EnvironmentType = Object.assign({}, this.environmentSchema);
    defaultEnvironment.uuid = '08ea9700-52cb-11e7-82da-8b8f3964b24c'; // random uuid
    defaultEnvironment.name = 'Example';
    this.routesTotal = 2;
    defaultEnvironment.routes.push(Object.assign(
      {}, this.routeSchema, { customHeaders: [{ uuid: uuid(), key: '', value: '' }] },
      { endpoint: 'answer', contentType: 'text/plain', body: '42' }
    ));
    defaultEnvironment.routes.push(Object.assign(
      {}, this.routeSchema, { customHeaders: [{ uuid: uuid(), key: '', value: '' }] },
      {
        method: 'post',
        endpoint: 'dolphins',
        contentType: 'application/json',
        body: '{\n    "response": "So Long, and Thanks for All the Fish"\n}'
      }
    ));
    defaultEnvironment.modifiedAt = new Date();

    return defaultEnvironment;
  }

  /**
   * Check if route is duplicated and mark it
   *
   * @param environment - environment to which check the route against
   */
  private checkRoutesDuplicates(environment: EnvironmentType) {
    environment.routes.forEach((firstRoute, firstRouteIndex) => {
      const duplicatedRoutesIndexes = [];

      // extract all routes with same endpoint than current one
      const duplicatedRoutes: RouteType[] = environment.routes.filter((otherRouteItem: RouteType, otherRouteIndex: number) => {
        // ignore same route
        if (otherRouteIndex === firstRouteIndex) {
          return false;
        } else {
          // if duplicated index keep duplicated route index in an array, return the duplicated route
          if (otherRouteItem.endpoint === firstRoute.endpoint && otherRouteItem.method === firstRoute.method) {
            duplicatedRoutesIndexes.push(otherRouteIndex);
            return true;
          } else {
            return false;
          }
        }
      });

      firstRoute.duplicates = duplicatedRoutesIndexes;
    });
  }

  /**
   * Check if environments are duplicated and mark them
   */
  private checkEnvironmentsDuplicates() {
    this.environments.forEach((environment, environmentIndex) => {
      const duplicatedEnvironmentsIndexes = [];

      // extract all environments with same port than current one
      const duplicatedEnvironments: EnvironmentType[] = this.environments.filter((
        otherEnvironmentItem: EnvironmentType,
        otherEnvironmentIndex: number
      ) => {
        // ignore same environment
        if (otherEnvironmentIndex === environmentIndex) {
          return false;
        } else {
          // if duplicated index keep duplicated route index in an array, return the duplicated route
          if (otherEnvironmentItem.port === environment.port) {
            duplicatedEnvironmentsIndexes.push(otherEnvironmentIndex);
            return true;
          } else {
            return false;
          }
        }
      });

      environment.duplicates = duplicatedEnvironmentsIndexes;
    });
  }

  /**
   * Clean environments before saving (avoid saving server instance and things like this)
   *
   * @param environments - environments to clean
   */
  private cleanBeforeSave(environments: EnvironmentsType) {
    const environmentsCopy: EnvironmentsType = this.environments.map((environment: EnvironmentType): EnvironmentType => {
      const environmentCopy = cloneDeep(environment);

      // remove some items
      delete environmentCopy.instance;
      delete environmentCopy.running;
      delete environmentCopy.startedAt;
      delete environmentCopy.needRestart;

      return environmentCopy;
    });

    return environmentsCopy;
  }

  /**
   * igrate data after loading if needed.
   * This cumulate all versions migration
   *
   * @param environments - environments to migrate
   */
  private migrateData(environments: EnvironmentsType) {
    environments.forEach((environment) => {
      // proxy settings
      if (!environment.proxyMode) {
        environment.proxyMode = false;
      }
      if (!environment.proxyHost) {
        environment.proxyHost = '';
      }
      if (!environment.https) {
        environment.https = false;
      }
    });

    return environments;
  }

  /**
   * Duplicate an environment and put it at the end
   *
   * @param environmentIndex
   * @param callback
   */
  public duplicateEnvironment(environmentIndex: number, callback: Function): number {
    // copy the environment, reset some properties
    const newEnvironment = Object.assign(
      {},
      this.environments[environmentIndex],
      {
        instance: null,
        running: false,
        uuid: uuid(),
        name: this.environments[environmentIndex].name + ' (copy)',
        startedAt: null,
        modifiedAt: null,
        duplicates: [],
        needRestart: false,
        routes: cloneDeep(this.environments[environmentIndex].routes) // avoid pass by reference for routes and headers
      }
    );
    this.routesTotal += this.environments[environmentIndex].routes.length;

    const newEnvironmentIndex = this.environments.push(newEnvironment) - 1;

    this.environmentUpdateEvents.next({ environment: newEnvironment, callback });

    return newEnvironmentIndex;
  }

  /**
   * Duplicate a route and add it at the end
   *
   * @param environment
   * @param routeIndex
   * @param callback
   */
  public duplicateRoute(environment: EnvironmentType, routeIndex: number, callback: Function): number {
    // copy the route, reset duplicates (use cloneDeep to avoid headers pass by reference)
    const newRoute = Object.assign({}, cloneDeep(environment.routes[routeIndex]), { duplicates: [] });
    const newRouteIndex = environment.routes.push(newRoute) - 1;
    this.routesTotal += 1;

    this.environmentUpdateEvents.next({ environment, callback });

    return newRouteIndex;
  }
}
