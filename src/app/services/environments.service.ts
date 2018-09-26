
import { Injectable } from '@angular/core';
import { clipboard, remote } from 'electron';
import * as storage from 'electron-json-storage';
import * as fs from 'fs';
import { cloneDeep } from 'lodash';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime } from 'rxjs/operators';
import { Errors } from 'src/app/enums/errors.enum';
import { Messages } from 'src/app/enums/messages.enum';
import { Migrations } from 'src/app/libs/migrations.lib';
import { AlertService } from 'src/app/services/alert.service';
import { DataService } from 'src/app/services/data.service';
import { EventsService } from 'src/app/services/events.service';
import { ServerService } from 'src/app/services/server.service';
import { SettingsService } from 'src/app/services/settings.service';
import { DataSubjectType, ExportType } from 'src/app/types/data.type';
import { CurrentEnvironmentType, EnvironmentsType, EnvironmentType } from 'src/app/types/environment.type';
import { CustomHeaderType, RouteType } from 'src/app/types/route.type';
import * as uuid from 'uuid/v1';

@Injectable()
export class EnvironmentsService {
  public selectEnvironment: Subject<number> = new Subject<number>();
  public environmentUpdateEvents: Subject<{
    environment?: EnvironmentType
  }> = new Subject<{
    environment: EnvironmentType
  }>();
  public environmentsReady: Subject<boolean> = new Subject<boolean>();
  public environments: EnvironmentsType;
  public routesTotal = 0;
  private dialog = remote.dialog;
  private BrowserWindow = remote.BrowserWindow;

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
    https: false,
    cors: true
  };

  private environmentResetSchema: Partial<EnvironmentType> = {
    instance: null,
    running: false,
    startedAt: null,
    modifiedAt: null,
    duplicates: [],
    needRestart: false
  };

  private routeSchema: RouteType = {
    uuid: '',
    method: 'get',
    endpoint: '',
    body: 'Environment is running.',
    latency: 0,
    statusCode: '200',
    customHeaders: [],
    file: null,
    duplicates: []
  };

  private customHeadersSchema: CustomHeaderType = { uuid: '', key: 'Content-Type', value: 'text/plain' };

  private storageKey = 'environments';

  constructor(
    private serverService: ServerService,
    private alertService: AlertService,
    private dataService: DataService,
    private eventsService: EventsService,
    private settingsService: SettingsService
  ) {
    // get existing environments from storage or default one
    storage.get(this.storageKey, (error, environments) => {
      // if empty object
      if (Object.keys(environments).length === 0 && environments.constructor === Object) {
        // build default starting env
        const defaultEnvironment: EnvironmentType = this.buildDefaultEnvironment();

        this.environments = [defaultEnvironment];

        this.environmentsReady.next(true);
      } else {
        // wait for settings to be ready before migrating and loading envs
        this.settingsService.settingsReady.subscribe((ready) => {
          if (ready) {
            this.environments = this.migrateData(environments);
            this.environmentsReady.next(true);
          }
        });
      }
    });

    // subscribe to environment data update from UI, and save
    this.environmentUpdateEvents.pipe(debounceTime(1000)).subscribe((params) => {
      storage.set(this.storageKey, this.cleanBeforeSave(this.environments));
    });

    // subscribe to environment data update from UI
    this.environmentUpdateEvents.pipe(debounceTime(100)).subscribe((params) => {
      if (params.environment) {
        this.checkRoutesDuplicates(params.environment);
      }

      this.checkEnvironmentsDuplicates();
    });
  }

  /**
   * Add a new environment and save it
   *
   */
  public addEnvironment(): number {
    const newRoute = Object.assign({}, this.routeSchema, { customHeaders: [Object.assign({}, this.customHeadersSchema, { uuid: uuid() })] });
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

    this.eventsService.analyticsEvents.next({ type: 'event', category: 'create', action: 'environment' });

    this.environmentUpdateEvents.next({ environment: newEnvironment });

    return newEnvironmentIndex;
  }

  /**
   * Add a new route and save it
   *
   * @param environment - environment to which add a route
   */
  public addRoute(environment: EnvironmentType): number {
    const newRoute = Object.assign({}, this.routeSchema, { customHeaders: [Object.assign({}, this.customHeadersSchema, { uuid: uuid() })] });
    const newRouteIndex = environment.routes.push(newRoute) - 1;
    this.routesTotal += 1;

    this.eventsService.analyticsEvents.next({ type: 'event', category: 'create', action: 'route' });

    this.environmentUpdateEvents.next({ environment });

    return newRouteIndex;
  }

  /**
   * Remove a route and save
   *
   * @param environment - environment to which remove a route
   * @param routeIndex - route index to remove
   */
  public removeRoute(environment: EnvironmentType, routeIndex: number) {
    // delete the route
    environment.routes.splice(routeIndex, 1);
    this.routesTotal -= 1;

    this.checkRoutesDuplicates(environment);

    this.eventsService.analyticsEvents.next({ type: 'event', category: 'delete', action: 'route' });

    this.environmentUpdateEvents.next({
      environment
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

    // delete the request logs
    this.serverService.deleteEnvironmentLogs(this.environments[environmentIndex].uuid);

    // delete the environment
    this.environments.splice(environmentIndex, 1);

    this.checkEnvironmentsDuplicates();

    this.environmentUpdateEvents.next({});
  }

  /**
   * Build a default environment when starting the application for the first time
   */
  private buildDefaultEnvironment(): EnvironmentType {
    const defaultEnvironment: EnvironmentType = Object.assign({}, this.environmentSchema);
    defaultEnvironment.uuid = uuid(); // random uuid
    defaultEnvironment.name = 'Example';
    this.routesTotal = 2;
    defaultEnvironment.routes.push(Object.assign(
      {}, this.routeSchema, { uuid: uuid(), customHeaders: [{ uuid: uuid(), key: 'Content-Type', value: 'text/plain' }] },
      { endpoint: 'answer', body: '42' }
    ));
    defaultEnvironment.routes.push(Object.assign(
      {}, this.routeSchema, { uuid: uuid(), customHeaders: [{ uuid: uuid(), key: 'Content-Type', value: 'application/json' }] },
      {
        method: 'post',
        endpoint: 'dolphins',
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
    if (this.environments) {
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
   * Migrate data after loading if needed.
   * This cumulate all versions migration
   *
   * @param environments - environments to migrate
   */
  private migrateData(environments: EnvironmentsType) {
    let wasUpdated = false;
    let lastMigrationId;

    Migrations.forEach(migration => {
      if (migration.id > this.settingsService.settings.lastMigration) {
        lastMigrationId = migration.id;

        environments.forEach(environment => migration.migrationFunction(environment));
        wasUpdated = true;
      }
    });

    if (wasUpdated) {
      // if a migration was played immediately save
      this.environmentUpdateEvents.next({});

      // save last migration in the settings
      this.settingsService.settings.lastMigration = lastMigrationId;
      this.settingsService.settingsUpdateEvents.next(this.settingsService.settings);
    }

    return environments;
  }

  /**
   * Renew all environments UUIDs
   *
   * @param data
   * @param subject
   */
  private renewUUIDs(data: EnvironmentsType | EnvironmentType | RouteType, subject: DataSubjectType) {
    if (subject === 'full') {
      (data as EnvironmentsType).forEach(environment => {
        environment.uuid = uuid();
        environment.routes.forEach(route => {
          route.uuid = uuid();
          route.customHeaders.forEach(customHeader => {
            customHeader.uuid = uuid();
          });
        });
      });
    } else if (subject === 'environment') {
      (data as EnvironmentType).uuid = uuid();
      (data as EnvironmentType).routes.forEach(route => {
        route.uuid = uuid();
        route.customHeaders.forEach(customHeader => {
          customHeader.uuid = uuid();
        });
      });
    } else if (subject === 'route') {
      (data as RouteType).uuid = uuid();
      (data as RouteType).customHeaders.forEach(customHeader => {
        customHeader.uuid = uuid();
      });
    }

    return data;
  }

  /**
   * Duplicate an environment and put it at the end
   *
   * @param environmentIndex
   */
  public duplicateEnvironment(environmentIndex: number): number {
    // copy the environment, reset some properties and change name
    let newEnvironment: EnvironmentType = Object.assign(
      cloneDeep(this.environments[environmentIndex]),
      this.environmentResetSchema,
      {
        name: this.environments[environmentIndex].name + ' (copy)'
      }
    );

    // add routes number to total
    this.routesTotal += this.environments[environmentIndex].routes.length;

    newEnvironment = this.renewUUIDs(newEnvironment, 'environment') as EnvironmentType;

    const newEnvironmentIndex = this.environments.push(newEnvironment) - 1;

    this.eventsService.analyticsEvents.next({ type: 'event', category: 'duplicate', action: 'environment' });

    this.environmentUpdateEvents.next({ environment: newEnvironment });

    return newEnvironmentIndex;
  }

  /**
   * Duplicate a route and add it at the end
   *
   * @param environment
   * @param routeIndex
   */
  public duplicateRoute(environment: EnvironmentType, routeIndex: number): number {
    // copy the route, reset duplicates (use cloneDeep to avoid headers pass by reference)
    let newRoute = Object.assign({}, cloneDeep(environment.routes[routeIndex]), { duplicates: [] });

    newRoute = this.renewUUIDs(newRoute, 'route') as RouteType;

    const newRouteIndex = environment.routes.push(newRoute) - 1;

    this.routesTotal += 1;

    this.eventsService.analyticsEvents.next({ type: 'event', category: 'duplicate', action: 'route' });

    this.environmentUpdateEvents.next({ environment });

    return newRouteIndex;
  }

  public findEnvironmentIndex(environmentUUID: string): number {
    return this.environments.findIndex(environment => environment.uuid === environmentUUID);
  }

  public findRouteIndex(environment: EnvironmentType, routeUUID: string): number {
    return environment.routes.findIndex(route => route.uuid === routeUUID);
  }

  /**
   * Export all envs in a json file
   */
  public exportAllEnvironments() {
    this.dialog.showSaveDialog(this.BrowserWindow.getFocusedWindow(), { filters: [{ name: 'JSON', extensions: ['json'] }] }, (path) => {
      // reset environments before exporting (cannot export running env with server instance)
      const dataToExport = cloneDeep(this.environments);
      dataToExport.forEach(environment => {
        Object.assign(environment, this.environmentResetSchema);
      });

      try {
        fs.writeFile(path, this.dataService.wrapExport(dataToExport, 'full'), (error) => {
          if (error) {
            this.alertService.showAlert('error', Errors.EXPORT_ERROR);
          } else {
            this.alertService.showAlert('success', Messages.EXPORT_SUCCESS);

            this.eventsService.analyticsEvents.next({ type: 'event', category: 'export', action: 'file' });
          }
        });
      } catch (error) {
        this.alertService.showAlert('error', Errors.EXPORT_ERROR);
      }
    });
  }

  /**
   * Export an environment to the clipboard
   *
   * @param environmentIndex
   */
  public exportEnvironmentToClipboard(environmentIndex: number) {
    try {
      // reset environment before exporting (cannot export running env with server instance)
      clipboard.writeText(this.dataService.wrapExport({ ...cloneDeep(this.environments[environmentIndex]), ...this.environmentResetSchema }, 'environment'));
      this.alertService.showAlert('success', Messages.EXPORT_ENVIRONMENT_CLIPBOARD_SUCCESS);
      this.eventsService.analyticsEvents.next({ type: 'event', category: 'export', action: 'clipboard' });
    } catch (error) {
      this.alertService.showAlert('error', Errors.EXPORT_ENVIRONMENT_CLIPBOARD_ERROR);
    }
  }

  /**
   * Export an environment to the clipboard
   *
   * @param environmentIndex
   * @param routeIndex
   */
  public exportRouteToClipboard(environmentIndex: number, routeIndex: number) {
    try {
      clipboard.writeText(this.dataService.wrapExport(this.environments[environmentIndex].routes[routeIndex], 'route'));
      this.alertService.showAlert('success', Messages.EXPORT_ROUTE_CLIPBOARD_SUCCESS);
      this.eventsService.analyticsEvents.next({ type: 'event', category: 'export', action: 'clipboard' });
    } catch (error) {
      this.alertService.showAlert('error', Errors.EXPORT_ROUTE_CLIPBOARD_ERROR);
    }
  }

  /**
   * Import an environment / route from clipboard
   * Append environment, append route in currently selected environment
   *
   * @param currentEnvironment
   */
  public importFromClipboard(currentEnvironment: CurrentEnvironmentType) {
    let importData: ExportType;
    try {
      importData = JSON.parse(clipboard.readText());

      // verify data checksum
      if (!this.dataService.verifyImportChecksum(importData)) {
        this.alertService.showAlert('error', Errors.IMPORT_CLIPBOARD_WRONG_CHECKSUM);
        return;
      }

      if (importData.subject === 'environment') {
        importData.data = this.renewUUIDs(importData.data as EnvironmentType, 'environment');
        this.environments.push(importData.data as EnvironmentType);
        this.environments = this.migrateData(this.environments);

        // if only one environment ask for selection of the one just created
        if (this.environments.length === 1) {
          this.selectEnvironment.next(0);
        }

        this.alertService.showAlert('success', Messages.IMPORT_ENVIRONMENT_CLIPBOARD_SUCCESS);
      } else if (importData.subject === 'route') {
        let currentEnvironmentIndex: number;
        // if no current environment create one and ask for selection
        if (this.environments.length === 0) {
          const newEnvironmentIndex = this.addEnvironment();

          this.selectEnvironment.next(newEnvironmentIndex);
          this.environments[0].routes = [];

          currentEnvironmentIndex = 0;
        } else {
          currentEnvironmentIndex = currentEnvironment.index;
        }

        importData.data = this.renewUUIDs(importData.data as RouteType, 'route');
        this.environments[currentEnvironmentIndex].routes.push(importData.data as RouteType);
        this.environments = this.migrateData(this.environments);

        this.alertService.showAlert('success', Messages.IMPORT_ROUTE_CLIPBOARD_SUCCESS);
      }

      this.environmentUpdateEvents.next({
        environment: (currentEnvironment) ? currentEnvironment.environment : null
      });

      this.eventsService.analyticsEvents.next({ type: 'event', category: 'import', action: 'clipboard' });
    } catch (error) {
      if (!importData) {
        this.alertService.showAlert('error', Errors.IMPORT_CLIPBOARD_WRONG_CHECKSUM);
        return;
      }

      if (importData.subject === 'environment') {
        this.alertService.showAlert('error', Errors.IMPORT_ENVIRONMENT_CLIPBOARD_ERROR);
      } else if (importData.subject === 'route') {
        this.alertService.showAlert('error', Errors.IMPORT_ROUTE_CLIPBOARD_ERROR);
      }
    }
  }

  /**
   * Import a json environments file in Mockoon's format.
   * Verify checksum and migrate data.
   *
   * Append imported envs to the env array.
   *
   * @param currentEnvironment
   */
  public importEnvironmentsFile(callback: Function) {
    this.dialog.showOpenDialog(this.BrowserWindow.getFocusedWindow(), { filters: [{ name: 'JSON', extensions: ['json'] }] }, (file) => {
      if (file && file[0]) {
        fs.readFile(file[0], 'utf-8', (error, fileContent) => {
          if (error) {
            this.alertService.showAlert('error', Errors.IMPORT_ERROR);
          } else {
            const importData: ExportType = JSON.parse(fileContent);

            // verify data checksum
            if (!this.dataService.verifyImportChecksum(importData)) {
              this.alertService.showAlert('error', Errors.IMPORT_FILE_WRONG_CHECKSUM);
              return;
            }

            importData.data = this.renewUUIDs(importData.data as EnvironmentsType, 'full');

            this.environments.push(...(importData.data as EnvironmentsType));

            // play migrations
            this.environments = this.migrateData(this.environments);

            this.environmentUpdateEvents.next({});

            this.alertService.showAlert('success', Messages.IMPORT_SUCCESS);

            this.eventsService.analyticsEvents.next({ type: 'event', category: 'import', action: 'file' });

            callback();
          }
        });
      }
    });
  }
}

