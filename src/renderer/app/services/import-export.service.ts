import { Injectable } from '@angular/core';
import {
  Environment,
  Environments,
  Export,
  ExportData,
  ExportDataEnvironment,
  ExportDataRoute,
  HighestMigrationId,
  Route
} from '@mockoon/commons';
import { cloneDeep } from 'lodash';
import { Logger } from 'src/renderer/app/classes/logger';
import { Config } from 'src/renderer/app/config';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { RouteSchema } from 'src/renderer/app/constants/environment-schema.constants';
import { AnalyticsEvents } from 'src/renderer/app/enums/analytics-events.enum';
import { Errors } from 'src/renderer/app/enums/errors.enum';
import { OldExport } from 'src/renderer/app/models/data.model';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { MigrationService } from 'src/renderer/app/services/migration.service';
import { OpenAPIConverterService } from 'src/renderer/app/services/openapi-converter.service';
import { SchemasBuilderService } from 'src/renderer/app/services/schemas-builder.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { addRouteAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

// Last migration done for each version
const oldVersionsMigrationTable = {
  '1.4.0': 5,
  '1.5.0': 6,
  '1.5.1': 7,
  '1.6.0': 8
};

@Injectable({ providedIn: 'root' })
export class ImportExportService extends Logger {
  private logger = new Logger('[SERVICE][IMPORT-EXPORT]');

  constructor(
    protected toastService: ToastsService,
    private store: Store,
    private eventsService: EventsService,
    private dataService: DataService,
    private migrationService: MigrationService,
    private schemasBuilderService: SchemasBuilderService,
    private openAPIConverterService: OpenAPIConverterService,
    private dialogsService: DialogsService,
    private environmentsService: EnvironmentsService
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
   * Load data from JSON file and import
   */
  public async importFromFile() {
    this.logger.info('Importing from file');

    const filePath = await this.dialogsService.showOpenDialog(
      'Import from JSON file',
      'json'
    );

    if (filePath) {
      try {
        const fileContent = await MainAPI.invoke('APP_READ_FILE', filePath);

        const importedData: Export & OldExport = JSON.parse(fileContent);

        this.import(importedData);

        this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_FILE);
      } catch (error) {
        this.logger.error(`Error while importing from file: ${error.message}`);
        this.toastService.addToast('error', Errors.IMPORT_ERROR);
      }
    }
  }

  /**
   * Load data from clipboard and import
   */
  public async importFromClipboard() {
    this.logger.info('Importing from clipboard');

    try {
      const importedData: Export & OldExport = JSON.parse(
        await MainAPI.invoke('APP_READ_CLIPBOARD')
      );

      this.import(importedData);

      this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_CLIPBOARD);
    } catch (error) {
      this.logger.info(
        `Error while importing from clipboard: ${error.message}`
      );

      this.toastService.addToast('error', Errors.IMPORT_CLIPBOARD_ERROR);
    }
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
  private import(importedData: Export & OldExport) {
    const dataToImport: Export = this.convertOldExports(importedData);

    if (!dataToImport) {
      return;
    }

    const dataToImportVersion: string = dataToImport.source.split(':')[1];

    dataToImport.data.forEach((data) => {
      if (data.type === 'environment') {
        if (data.item.lastMigration > HighestMigrationId) {
          this.logMessage('info', 'ENVIRONMENT_MORE_RECENT_VERSION', {
            name: data.item.name,
            uuid: data.item.uuid
          });

          return;
        }

        this.migrationService
          .migrateEnvironments([data.item])
          .subscribe(([migratedEnvironment]) => {
            this.logger.info(
              `Importing environment ${migratedEnvironment.uuid}`
            );

            this.environmentsService
              .addEnvironment(migratedEnvironment)
              .subscribe();
          });
      } else if (
        // routes cannot be migrated yet so we check the appVersion
        data.type === 'route' &&
        dataToImportVersion === Config.appVersion
      ) {
        // other cases do not renew UUIDs as duplicated ones will be handled by the env service. Here we don't really care about always renewing the uuids for single routes
        data.item = this.dataService.renewRouteUUIDs(data.item);

        this.logger.info(`Importing route ${data.item.uuid}`);

        // if has a current environment append imported route
        if (this.store.get('activeEnvironmentUUID')) {
          this.store.update(
            RouteSchema.validate(addRouteAction(data.item)).value
          );
        } else {
          const newEnvironment: Environment = {
            ...this.schemasBuilderService.buildEnvironment(),
            routes: [data.item]
          };

          this.environmentsService.addEnvironment(newEnvironment).subscribe();
        }
      } else if (dataToImportVersion !== Config.appVersion) {
        this.logger.info(
          `Route ${data.item.uuid} has incorrect version ${dataToImportVersion} and cannot be imported`
        );

        this.toastService.addToast(
          'warning',
          Errors.IMPORT_INCOMPATIBLE_VERSION.replace(
            '{fileVersion}',
            dataToImportVersion
          )
        );
      }
    });
  }

  /**
   * Convert importedData from older versions if needed
   *
   * @param importedData
   */
  private convertOldExports(importedData: OldExport & Export): Export {
    if (
      importedData.id &&
      importedData.id === 'mockoon_export' &&
      importedData.appVersion
    ) {
      const oldImportedData: OldExport = importedData;
      const convertedData: Export = {
        source: `mockoon:${oldImportedData.appVersion}`,
        data: []
      };

      if (oldImportedData.subject === 'environment') {
        (oldImportedData.data as Environment).lastMigration =
          oldVersionsMigrationTable[oldImportedData.appVersion];

        convertedData.data = [
          { type: 'environment', item: oldImportedData.data as Environment }
        ];
      } else if (oldImportedData.subject === 'route') {
        convertedData.data = [
          { type: 'route', item: oldImportedData.data as Route }
        ];
      } else {
        convertedData.data = (oldImportedData.data as Environments).map(
          (importedItem) => {
            importedItem.lastMigration =
              oldVersionsMigrationTable[oldImportedData.appVersion];

            return { type: 'environment', item: importedItem };
          }
        );
      }

      return convertedData;
    } else {
      return importedData as Export;
    }
  }
}
