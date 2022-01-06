import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Environment,
  Environments,
  Export,
  ExportData,
  ExportDataEnvironment,
  ExportDataRoute,
  HighestMigrationId,
  Route,
  RouteSchema
} from '@mockoon/commons';
import { cloneDeep } from 'lodash';
import { EMPTY, from, Observable } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  map,
  switchMap,
  tap
} from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { AnalyticsEvents } from 'src/renderer/app/enums/analytics-events.enum';
import { Errors } from 'src/renderer/app/enums/errors.enum';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { OpenAPIConverterService } from 'src/renderer/app/services/openapi-converter.service';
import { SchemasBuilderService } from 'src/renderer/app/services/schemas-builder.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { addRouteAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';

@Injectable({ providedIn: 'root' })
export class ImportExportService extends Logger {
  private logger = new Logger('[SERVICE][IMPORT-EXPORT]');

  constructor(
    protected toastService: ToastsService,
    private store: Store,
    private eventsService: EventsService,
    private dataService: DataService,
    private schemasBuilderService: SchemasBuilderService,
    private openAPIConverterService: OpenAPIConverterService,
    private dialogsService: DialogsService,
    private environmentsService: EnvironmentsService,
    private http: HttpClient
  ) {
    super('[SERVICE][IMPORT-EXPORT]', toastService);
  }

  /**
   * Export all envs in a json file
   */
  public async exportAllEnvironments() {
    const environments = this.store.get('environments');

    if (environments.length === 0) {
      return;
    }

    this.logger.info('Exporting all environments to a file');

    const filePath = await this.dialogsService.showSaveDialog(
      'Export all environments to JSON'
    );

    // clone environments before exporting
    const dataToExport = cloneDeep(environments);

    // dialog not cancelled
    if (filePath) {
      try {
        await this.exportDataToFilePath(dataToExport, filePath);
        this.logMessage('info', 'EXPORT_SUCCESS');

        this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_FILE);
      } catch (error) {
        this.toastService.addToast('error', Errors.EXPORT_ERROR);
      }
    }
  }

  /**
   * Export active env in a json file
   */
  public async exportActiveEnvironment() {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (!activeEnvironment) {
      return;
    }

    this.logger.info('Exporting active environment to a file');

    const filePath = await this.dialogsService.showSaveDialog(
      'Export current environment to JSON'
    );

    // clone environment before exporting
    const dataToExport = cloneDeep(activeEnvironment);

    // dialog not cancelled
    if (filePath) {
      try {
        await this.exportDataToFilePath(dataToExport, filePath);
        this.logMessage('info', 'EXPORT_SELECTED_SUCCESS');

        this.eventsService.analyticsEvents.next(
          AnalyticsEvents.EXPORT_FILE_SELECTED
        );
      } catch (error) {
        this.toastService.addToast('error', Errors.EXPORT_ERROR);
      }
    }
  }

  /**
   * Export an environment to the clipboard
   *
   * @param environmentUUID
   */
  public exportEnvironmentToClipboard(environmentUUID: string) {
    this.logger.info(
      `Exporting environment ${environmentUUID} to the clipboard`
    );

    const environment = this.store.getEnvironmentByUUID(environmentUUID);

    try {
      // reset environment before exporting
      MainAPI.send(
        'APP_WRITE_CLIPBOARD',
        this.prepareExport({
          data: cloneDeep(environment),
          subject: 'environment'
        })
      );

      this.logMessage('info', 'EXPORT_ENVIRONMENT_CLIPBOARD_SUCCESS');

      this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_CLIPBOARD);
    } catch (error) {
      this.logger.error(
        `Error while exporting environment ${environmentUUID} to the clipboard: ${error.message}`
      );

      this.toastService.addToast(
        'error',
        Errors.EXPORT_ENVIRONMENT_CLIPBOARD_ERROR
      );
    }
  }

  /**
   * Export a route from the active environment to the clipboard
   *
   * @param routeUUID
   */
  public exportRouteToClipboard(routeUUID: string) {
    this.logger.info(`Exporting route ${routeUUID} to the clipboard`);

    const environment = this.store.getActiveEnvironment();

    try {
      MainAPI.send(
        'APP_WRITE_CLIPBOARD',
        this.prepareExport({
          data: cloneDeep(
            environment.routes.find((route) => route.uuid === routeUUID)
          ),
          subject: 'route'
        })
      );
      this.logMessage('info', 'EXPORT_ROUTE_CLIPBOARD_SUCCESS');
      this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_CLIPBOARD);
    } catch (error) {
      this.logger.error(
        `Error while exporting route ${routeUUID} to the clipboard: ${error.message}`
      );

      this.toastService.addToast('error', Errors.EXPORT_ROUTE_CLIPBOARD_ERROR);
    }
  }

  /**
   * Load data from an URL (used for custom protocol)
   *
   * @param url
   * @returns
   */
  public importFromUrl(url: string): Observable<[string, string]> {
    this.logger.info(`Importing from URL: ${url}`);

    return this.http.get(url, { responseType: 'text' }).pipe(
      map<string, Export>((data) => JSON.parse(data)),
      switchMap((data) => this.import(data))
    );
  }

  /**
   * Load data from JSON file and import
   */
  public importFromFile(): Observable<[string, string]> {
    this.logMessage('info', 'IMPORT_FROM_FILE');

    return from(
      this.dialogsService.showOpenDialog('Import from JSON file', 'json')
    ).pipe(
      filter((filePath) => !!filePath),
      switchMap((filePath) => from(MainAPI.invoke('APP_READ_FILE', filePath))),
      map((data: string) => JSON.parse(data)),
      switchMap((data: Export) => this.import(data)),
      tap(() => {
        this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_FILE);
      }),
      catchError((error) => {
        this.logMessage('error', 'IMPORT_FILE_ERROR', {
          message: error.message
        });

        return EMPTY;
      })
    );
  }

  /**
   * Load data from clipboard and import
   */
  public importFromClipboard(): Observable<[string, string]> {
    this.logMessage('info', 'IMPORT_FROM_CLIPBOARD');

    return from(MainAPI.invoke('APP_READ_CLIPBOARD')).pipe(
      map((data: string) => JSON.parse(data)),
      switchMap((data: Export) => this.import(data)),
      tap(() => {
        this.eventsService.analyticsEvents.next(
          AnalyticsEvents.IMPORT_CLIPBOARD
        );
      }),
      catchError((error) => {
        this.logMessage('error', 'IMPORT_CLIPBOARD_ERROR', {
          message: error.message
        });

        return EMPTY;
      })
    );
  }

  /**
   * Import an OpenAPI (v2/v3) file in Mockoon's format.
   * Append imported envs to the env array.
   */
  public async importOpenAPIFile() {
    this.logger.info('Importing OpenAPI file');

    const filePath = await this.dialogsService.showOpenDialog(
      'Import OpenAPI specification file',
      'openapi'
    );

    if (filePath) {
      const environment = await this.openAPIConverterService.import(filePath);

      if (environment) {
        this.environmentsService.addEnvironment(environment).subscribe();

        this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_FILE);
      }
    }
  }

  /**
   * Export all environments to an OpenAPI v3 file
   */
  public async exportOpenAPIFile() {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (!activeEnvironment) {
      return;
    }

    this.logger.info('Exporting to OpenAPI file');

    const filePath = await this.dialogsService.showSaveDialog(
      'Export environment to OpenAPI JSON'
    );

    // dialog not cancelled
    if (filePath) {
      try {
        await MainAPI.invoke(
          'APP_WRITE_FILE',
          filePath,
          await this.openAPIConverterService.export(activeEnvironment)
        );

        this.logMessage('info', 'EXPORT_SUCCESS');
        this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_FILE);
      } catch (error) {
        this.logger.info('Error while exporting to OpenAPI file');

        this.toastService.addToast('error', Errors.EXPORT_ERROR);
      }
    }
  }

  /**
   * Writes JSON data to the specified filePath in Mockoon format.
   *
   * @param dataToExport
   * @param filePath
   */
  private async exportDataToFilePath(dataToExport, filePath) {
    try {
      await MainAPI.invoke(
        'APP_WRITE_FILE',
        filePath,
        this.prepareExport({ data: dataToExport, subject: 'environment' })
      );
    } catch (error) {
      this.logger.error(`Error while exporting environments: ${error.message}`);

      this.toastService.addToast('error', Errors.EXPORT_ERROR);
    }
  }

  /**
   * Wrap data to export in Mockoon export format
   *
   * @param data
   * @param subject
   */
  private prepareExport(
    params:
      | {
          data: Environment | Environments;
          subject: 'environment';
        }
      | {
          data: Route;
          subject: 'route';
        }
  ): string {
    let dataToExport: ExportData = [];

    const data: (Environment | Route)[] = Array.isArray(params.data)
      ? params.data
      : [params.data];

    dataToExport = data.map(
      (dataItem) =>
        ({
          type: params.subject,
          item: dataItem
        } as ExportDataRoute | ExportDataEnvironment)
    );

    return JSON.stringify(
      {
        source: `mockoon:${Config.appVersion}`,
        data: dataToExport
      } as Export,
      null,
      4
    );
  }

  /**
   * Import and migrate data
   * Routes are not migrated, and a version check is done before importing
   *
   * @param importedData
   */
  private import(importedData: Export) {
    // return if imported data are empty or source property is not present
    if (!this.dataService.isExportData(importedData)) {
      this.logMessage('error', 'IMPORT_FILE_INVALID');

      return EMPTY;
    }

    const dataImportVersion: string = importedData.source.split(':')[1];

    return from(importedData.data).pipe(
      filter((data) => {
        if (
          data.type === 'environment' &&
          data.item.lastMigration > HighestMigrationId
        ) {
          // environment is too recent
          this.logMessage('error', 'ENVIRONMENT_MORE_RECENT_VERSION', {
            name: data.item.name,
            uuid: data.item.uuid
          });

          return false;
        } else if (
          data.type === 'route' &&
          dataImportVersion !== Config.appVersion
        ) {
          // routes cannot be migrated yet so we check the appVersion

          this.logMessage('error', 'IMPORT_ROUTE_INCORRECT_VERSION', {
            uuid: data.item.uuid,
            dataToImportVersion: dataImportVersion
          });

          return false;
        }

        return true;
      }),
      concatMap((data) => {
        //return from(new Promise((resolve) => setTimeout(resolve, 3000)));
        if (data.type === 'environment') {
          const migratedEnvironment =
            this.dataService.migrateAndValidateEnvironment(data.item);

          this.logMessage('info', 'IMPORT_ENVIRONMENT', {
            uuid: migratedEnvironment.uuid
          });

          return this.environmentsService.addEnvironment(migratedEnvironment);
        } else if (data.type === 'route') {
          data.item = RouteSchema.validate(data.item).value;

          // other cases do not renew UUIDs as duplicated ones will be handled by the data service. Here we don't really care about always renewing the uuids for single routes
          data.item = this.dataService.renewRouteUUIDs(data.item);

          this.logMessage('info', 'IMPORT_ROUTE', {
            uuid: data.item.uuid
          });

          // if has a current environment append imported route
          if (this.store.get('activeEnvironmentUUID')) {
            this.store.update(addRouteAction(data.item));

            return EMPTY;
          } else {
            return this.environmentsService.addEnvironment({
              ...this.schemasBuilderService.buildEnvironment(),
              routes: [data.item]
            });
          }
        }

        return EMPTY;
      })
    );
  }
}
