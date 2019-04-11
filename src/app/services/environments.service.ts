
import { Injectable } from '@angular/core';
import { clipboard, remote } from 'electron';
import * as storage from 'electron-json-storage';
import * as fs from 'fs';
import { cloneDeep } from 'lodash';
import { debounceTime, filter, first } from 'rxjs/operators';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { Errors } from 'src/app/enums/errors.enum';
import { Messages } from 'src/app/enums/messages.enum';
import { Migrations } from 'src/app/libs/migrations.lib';
import { DataService } from 'src/app/services/data.service';
import { EventsService } from 'src/app/services/events.service';
import { ServerService } from 'src/app/services/server.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { ReducerDirectionType } from 'src/app/stores/reducer';
import { Store, TabsNameType } from 'src/app/stores/store';
import { DataSubjectType, ExportType } from 'src/app/types/data.type';
import { EnvironmentsType, EnvironmentType } from 'src/app/types/environment.type';
import { CORSHeaders, HeaderType, RouteType } from 'src/app/types/route.type';
import * as uuid from 'uuid/v1';
const appVersion = require('../../../package.json').version;

@Injectable()
export class EnvironmentsService {
  private dialog = remote.dialog;
  private BrowserWindow = remote.BrowserWindow;
  private environmentSchema: EnvironmentType = {
    uuid: '',
    name: '',
    endpointPrefix: '',
    latency: 0,
    port: 3000,
    routes: [],
    proxyMode: false,
    proxyHost: '',
    https: false,
    cors: true,
    headers: []
  };

  private routeSchema: RouteType = {
    uuid: '',
    documentation: '',
    method: 'get',
    endpoint: '',
    body: '{}',
    latency: 0,
    statusCode: '200',
    headers: [],
    filePath: '',
    sendFileAsBody: false
  };

  private emptyHeaderSchema: HeaderType = { key: '', value: '' };
  private routeHeadersSchema: HeaderType = { key: '', value: '' };
  private storageKey = 'environments';

  constructor(
    private toastService: ToastsService,
    private dataService: DataService,
    private eventsService: EventsService,
    private settingsService: SettingsService,
    private store: Store,
    private serverService: ServerService
  ) {
    // get existing environments from storage or default one
    storage.get(this.storageKey, (_error: any, environments: EnvironmentType[]) => {
      // if empty object build default starting env
      if (Object.keys(environments).length === 0 && environments.constructor === Object) {
        this.store.update({ type: 'SET_INITIAL_ENVIRONMENTS', item: [this.buildDefaultEnvironment()] });
      } else {
        // wait for settings to be ready before migrating and loading envs
        this.store.select('settings').pipe(
          filter(Boolean),
          first()
        ).subscribe(() => {
          this.store.update({ type: 'SET_INITIAL_ENVIRONMENTS', item: this.migrateData(environments) });
        });
      }
    });

    // subscribe to environments update to save
    this.store.select('environments').pipe(debounceTime(2000)).subscribe((environments) => {
      storage.set(this.storageKey, environments);
    });
  }

  /**
   * Set active environment by UUID or navigation
   */
  public setActiveEnvironment(environmentUUIDOrDirection: string | ReducerDirectionType) {
    if (this.store.get('activeEnvironmentUUID') !== environmentUUIDOrDirection) {
      if (environmentUUIDOrDirection === 'next' || environmentUUIDOrDirection === 'previous') {
        this.store.update({ type: 'NAVIGATE_ENVIRONMENTS', direction: environmentUUIDOrDirection });
      } else {
        this.store.update({ type: 'SET_ACTIVE_ENVIRONMENT', UUID: environmentUUIDOrDirection });
      }

      this.eventsService.analyticsEvents.next(AnalyticsEvents.NAVIGATE_ENVIRONMENT);
    }
  }

  /**
   * Set active route by UUID or navigation
   */
  public setActiveRoute(routeUUIDOrDirection: string | ReducerDirectionType) {
    if (this.store.get('activeRouteUUID') !== routeUUIDOrDirection) {
      if (routeUUIDOrDirection === 'next' || routeUUIDOrDirection === 'previous') {
        this.store.update({ type: 'NAVIGATE_ROUTES', direction: routeUUIDOrDirection });
      } else {
        this.store.update({ type: 'SET_ACTIVE_ROUTE', UUID: routeUUIDOrDirection });
      }

      this.eventsService.analyticsEvents.next(AnalyticsEvents.NAVIGATE_ROUTE);
    }
  }

  /**
   * Add a new environment and save it in the store
   */
  public addEnvironment() {
    this.store.update({ type: 'ADD_ENVIRONMENT', item: this.buildNewEnvironment() });
    this.eventsService.analyticsEvents.next(AnalyticsEvents.CREATE_ENVIRONMENT);
  }

  /**
   * Duplicate an environment, or the active environment and append it at the end of the list.
   */
  public duplicateEnvironment(environmentUUID?: string) {
    let environmentToDuplicate = this.store.getActiveEnvironment();

    if (environmentUUID) {
      environmentToDuplicate = this.store.get('environments').find(environment => environment.uuid === environmentUUID);
    }

    if (environmentToDuplicate) {
      // copy the environment, reset some properties and change name
      let newEnvironment: EnvironmentType = {
        ...cloneDeep(environmentToDuplicate),
        name: `${environmentToDuplicate.name} (copy)`
      };

      newEnvironment = this.renewUUIDs(newEnvironment, 'environment') as EnvironmentType;

      this.store.update({ type: 'ADD_ENVIRONMENT', item: newEnvironment });

      this.eventsService.analyticsEvents.next(AnalyticsEvents.DUPLICATE_ENVIRONMENT);
    }
  }

  /**
   * Remove an environment or the current one if not environmentUUID is provided
   */
  public removeEnvironment(environmentUUID?: string) {
    const currentEnvironmentUUID = this.store.get('activeEnvironmentUUID');

    if (!environmentUUID) {
      if (!currentEnvironmentUUID) {
        return;
      }
      environmentUUID = this.store.get('activeEnvironmentUUID');
    }

    this.serverService.stop(environmentUUID);

    this.store.update({ type: 'REMOVE_ENVIRONMENT', UUID: environmentUUID });

    this.eventsService.analyticsEvents.next(AnalyticsEvents.DELETE_ENVIRONMENT);
  }

  /**
   * Add a new route and save it in the store
   */
  public addRoute() {
    const newRoute: RouteType = {
      ...this.routeSchema,
      uuid: uuid(),
      headers: [
        { ...this.routeHeadersSchema }
      ]
    };

    this.store.update({ type: 'ADD_ROUTE', item: newRoute });
    this.eventsService.analyticsEvents.next(AnalyticsEvents.CREATE_ROUTE);
  }

  /**
   * Duplicate a route, or the current active route and append it at the end
   */
  public duplicateRoute(routeUUID?: string) {
    let routeToDuplicate = this.store.getActiveRoute();

    if (routeUUID) {
      routeToDuplicate = this.store.getActiveEnvironment().routes.find(route => route.uuid === routeUUID);
    }

    if (routeToDuplicate) {
      let newRoute: RouteType = cloneDeep(routeToDuplicate);

      newRoute = this.renewUUIDs(newRoute, 'route') as RouteType;

      this.store.update({ type: 'ADD_ROUTE', item: newRoute });

      this.eventsService.analyticsEvents.next(AnalyticsEvents.DUPLICATE_ROUTE);
    }
  }

  /**
   * Remove a route and save
   */
  public removeRoute(routeUUID: string = this.store.get('activeRouteUUID')) {
    this.store.update({ type: 'REMOVE_ROUTE', UUID: routeUUID });

    this.eventsService.analyticsEvents.next(AnalyticsEvents.DELETE_ROUTE);
  }

  /**
   * Set active tab
   */
  public setActiveTab(activeTab: TabsNameType) {
    this.store.update({ type: 'SET_ACTIVE_TAB', item: activeTab });
  }

  /**
   * Update the active environment
   */
  public updateActiveEnvironment(properties: { [T in keyof EnvironmentType]?: EnvironmentType[T] }) {
    this.store.update({ type: 'UPDATE_ENVIRONMENT', properties });
  }

  /**
   * Update the active route
   */
  public updateActiveRoute(properties: { [T in keyof RouteType]?: RouteType[T] }) {
    this.store.update({ type: 'UPDATE_ROUTE', properties });
  }

  /**
   * Start / stop active environment
   */
  public toggleActiveEnvironment() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const environmentsStatus = this.store.get('environmentsStatus');
    const activeEnvironmentState = environmentsStatus[activeEnvironment.uuid];

    if (activeEnvironmentState.running) {
      this.serverService.stop(activeEnvironment.uuid);

      this.eventsService.analyticsEvents.next(AnalyticsEvents.SERVER_STOP);

      if (activeEnvironmentState.needRestart) {
        this.serverService.start(activeEnvironment);
        this.eventsService.analyticsEvents.next(AnalyticsEvents.SERVER_RESTART);
      }
    } else {
      this.serverService.start(activeEnvironment);
      this.eventsService.analyticsEvents.next(AnalyticsEvents.SERVER_START);
    }
  }

  /**
   * Build a new environment
   */
  private buildNewEnvironment(): EnvironmentType {
    return {
      ...this.environmentSchema,
      uuid: uuid(),
      name: 'New environment',
      port: 3000,
      routes: [
        {
          ...this.routeSchema,
          headers: [
            { ...this.routeHeadersSchema }
          ]
        }
      ],
      headers: [{ key: 'Content-Type', value: 'application/json' }]
    };
  }

  /**
   * Build a default environment when starting the application for the first time
   */
  private buildDefaultEnvironment(): EnvironmentType {
    return {
      ...this.environmentSchema,
      uuid: uuid(),
      name: 'Example',
      headers: [{ ...this.emptyHeaderSchema }],
      routes: [
        {
          ...this.routeSchema,
          uuid: uuid(),
          headers: [{ key: 'Content-Type', value: 'text/plain' }],
          endpoint: 'answer',
          body: '42'
        },
        {
          ...this.routeSchema,
          uuid: uuid(),
          headers: [{ key: 'Content-Type', value: 'application/json' }],
          method: 'post',
          endpoint: 'dolphins',
          body: '{\n    "response": "So Long, and Thanks for All the Fish"\n}'
        }
      ]
    };
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
      if (migration.id > this.store.get('settings').lastMigration) {
        lastMigrationId = migration.id;

        environments.forEach(environment => migration.migrationFunction(environment));
        wasUpdated = true;
      }
    });

    if (wasUpdated) {
      // save last migration in the settings
      this.settingsService.updateSettings({ lastMigration: lastMigrationId });
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
        this.renewUUIDs(environment, 'environment');
      });
    } else if (subject === 'environment') {
      (data as EnvironmentType).uuid = uuid();
      (data as EnvironmentType).routes.forEach(route => {
        this.renewUUIDs(route, 'route');
      });
    } else if (subject === 'route') {
      (data as RouteType).uuid = uuid();
    }

    return data;
  }

  /**
   * Move a menu item (envs / routes)
   */
  public moveMenuItem(type: 'routes' | 'environments' | string, sourceIndex: number, targetIndex: number) {
    this.store.update({ type: (type === 'environments') ? 'MOVE_ENVIRONMENTS' : 'MOVE_ROUTES', indexes: { sourceIndex, targetIndex } });
  }

  /**
   * Export all envs in a json file
   */
  public exportAllEnvironments() {
    const environments = this.store.get('environments');

    this.dialog.showSaveDialog(this.BrowserWindow.getFocusedWindow(), { filters: [{ name: 'JSON', extensions: ['json'] }] }, (path) => {
      // If the user clicked 'cancel'
      if (path === undefined) {
        return;
      }

      // reset environments before exporting
      const dataToExport = cloneDeep(environments);

      try {
        fs.writeFile(path, this.dataService.wrapExport(dataToExport, 'full'), (error) => {
          if (error) {
            this.toastService.addToast('error', Errors.EXPORT_ERROR);
          } else {
            this.toastService.addToast('success', Messages.EXPORT_SUCCESS);

            this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_FILE);
          }
        });
      } catch (error) {
        this.toastService.addToast('error', Errors.EXPORT_ERROR);
      }
    });
  }

  /**
   * Export an environment to the clipboard
   *
   * @param environmentUUID
   */
  public exportEnvironmentToClipboard(environmentUUID: string) {
    const environment = this.store.getEnvironmentByUUID(environmentUUID);

    try {
      // reset environment before exporting
      clipboard.writeText(this.dataService.wrapExport(cloneDeep(environment), 'environment'));
      this.toastService.addToast('success', Messages.EXPORT_ENVIRONMENT_CLIPBOARD_SUCCESS);
      this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_CLIPBOARD);
    } catch (error) {
      this.toastService.addToast('error', Errors.EXPORT_ENVIRONMENT_CLIPBOARD_ERROR);
    }
  }

  /**
   * Export a route from the active environment to the clipboard
   *
   * @param routeUUID
   */
  public exportRouteToClipboard(routeUUID: string) {
    const environment = this.store.getActiveEnvironment();

    try {
      clipboard.writeText(this.dataService.wrapExport(environment.routes.find(route => route.uuid === routeUUID), 'route'));
      this.toastService.addToast('success', Messages.EXPORT_ROUTE_CLIPBOARD_SUCCESS);
      this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_CLIPBOARD);
    } catch (error) {
      this.toastService.addToast('error', Errors.EXPORT_ROUTE_CLIPBOARD_ERROR);
    }
  }

  /**
   * Import an environment / route from clipboard
   * Append environment, append route in currently selected environment
   */
  public importFromClipboard() {
    let importData: ExportType;

    try {
      importData = JSON.parse(clipboard.readText());

      // verify data checksum
      if (!this.dataService.verifyImportChecksum(importData)) {
        this.toastService.addToast('error', Errors.IMPORT_CLIPBOARD_WRONG_CHECKSUM);
        return;
      }

      // verify version compatibility
      if (importData.appVersion !== appVersion) {
        this.toastService.addToast('error', Errors.IMPORT_WRONG_VERSION);
        return;
      }

      if (importData.subject === 'environment') {
        importData.data = this.renewUUIDs(importData.data as EnvironmentType, 'environment');
        this.store.update({ type: 'ADD_ENVIRONMENT', item: importData.data });
      } else if (importData.subject === 'route') {
        importData.data = this.renewUUIDs(importData.data as RouteType, 'route');

        // if has a current environment append imported route
        if (this.store.get('activeEnvironmentUUID')) {
          this.store.update({ type: 'ADD_ROUTE', item: importData.data });
        } else {
          const newEnvironment: EnvironmentType = {
            ...this.buildNewEnvironment(),
            routes: [importData.data as RouteType]
          };

          this.store.update({ type: 'ADD_ENVIRONMENT', item: newEnvironment });
        }
      }

      this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_CLIPBOARD);
    } catch (error) {
      if (!importData) {
        this.toastService.addToast('error', Errors.IMPORT_CLIPBOARD_WRONG_CHECKSUM);
        return;
      }

      if (importData.subject === 'environment') {
        this.toastService.addToast('error', Errors.IMPORT_ENVIRONMENT_CLIPBOARD_ERROR);
      } else if (importData.subject === 'route') {
        this.toastService.addToast('error', Errors.IMPORT_ROUTE_CLIPBOARD_ERROR);
      }
    }
  }

  /**
   * Import a json environments file in Mockoon's format.
   * Verify checksum and migrate data.
   *
   * Append imported envs to the env array.
   */
  public importEnvironmentsFile() {
    this.dialog.showOpenDialog(this.BrowserWindow.getFocusedWindow(), { filters: [{ name: 'JSON', extensions: ['json'] }] }, (file) => {
      if (file && file[0]) {
        fs.readFile(file[0], 'utf-8', (error, fileContent) => {
          if (error) {
            this.toastService.addToast('error', Errors.IMPORT_ERROR);
          } else {
            const importData: ExportType = JSON.parse(fileContent);

            // verify data checksum
            if (!this.dataService.verifyImportChecksum(importData)) {
              this.toastService.addToast('error', Errors.IMPORT_FILE_WRONG_CHECKSUM);
              return;
            }

            // verify version compatibility
            if (importData.appVersion !== appVersion) {
              this.toastService.addToast('error', Errors.IMPORT_WRONG_VERSION);
              return;
            }

            importData.data = this.renewUUIDs(importData.data as EnvironmentsType, 'full');
            (importData.data as EnvironmentsType).forEach(environment => {
              this.store.update({ type: 'ADD_ENVIRONMENT', item: environment });
            });

            this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_FILE);
          }
        });
      }
    });
  }

  /**
   * Check if active environment has headers
   */
  public hasEnvironmentHeaders() {
    const activeEnvironment = this.store.getActiveEnvironment();
    return activeEnvironment && activeEnvironment.headers.some(header => !!header.key);
  }

  /**
   * Emit an headers injection event in order to add CORS headers to the headers list component
   */
  public setEnvironmentCORSHeaders() {
    this.eventsService.injectHeaders.emit({ target: 'environmentHeaders', headers: CORSHeaders });
  }
}
