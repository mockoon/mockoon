import { Injectable } from '@angular/core';
import { clipboard, remote } from 'electron';
import * as fs from 'fs';
import { cloneDeep } from 'lodash';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { Errors } from 'src/app/enums/errors.enum';
import { Messages } from 'src/app/enums/messages.enum';
import { DataService } from 'src/app/services/data.service';
import { EventsService } from 'src/app/services/events.service';
import { MigrationService } from 'src/app/services/migration.service';
import { OpenAPIConverterService } from 'src/app/services/openapi-converter.service';
import { SchemasBuilderService } from 'src/app/services/schemas-builder.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { addEnvironmentAction, addRouteAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';
import {
  Export,
  ExportData,
  ExportDataEnvironment,
  ExportDataRoute,
  OldExport
} from 'src/app/types/data.type';
import { Environment, Environments } from 'src/app/types/environment.type';
import { Route } from 'src/app/types/route.type';

const appVersion = require('../../../package.json').version;
// Last migration done for each version
const oldVersionsMigrationTable = {
  '1.4.0': 5,
  '1.5.0': 6,
  '1.5.1': 7,
  '1.6.0': 8
};

@Injectable({ providedIn: 'root' })
export class ImportExportService {
  private dialog = remote.dialog;
  private BrowserWindow = remote.BrowserWindow;

  constructor(
    private store: Store,
    private toastService: ToastsService,
    private eventsService: EventsService,
    private dataService: DataService,
    private migrationService: MigrationService,
    private schemasBuilderService: SchemasBuilderService,
    private openAPIConverterService: OpenAPIConverterService
  ) {}

  /**
   * Export all envs in a json file
   */
  public async exportAllEnvironments() {
    const environments = this.store.get('environments');

    const filePath = await this.openSaveDialog('Export all to JSON');

    // clone environments before exporting
    const dataToExport = cloneDeep(environments);

    try {
      fs.writeFile(
        filePath,
        this.prepareExport({ data: dataToExport, subject: 'environment' }),
        error => {
          if (error) {
            this.toastService.addToast('error', Errors.EXPORT_ERROR);
          } else {
            this.toastService.addToast('success', Messages.EXPORT_SUCCESS);

            this.eventsService.analyticsEvents.next(
              AnalyticsEvents.EXPORT_FILE
            );
          }
        }
      );
    } catch (error) {
      this.toastService.addToast('error', Errors.EXPORT_ERROR);
    }
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
      clipboard.writeText(
        this.prepareExport({
          data: cloneDeep(environment),
          subject: 'environment'
        })
      );
      this.toastService.addToast(
        'success',
        Messages.EXPORT_ENVIRONMENT_CLIPBOARD_SUCCESS
      );
      this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_CLIPBOARD);
    } catch (error) {
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
    const environment = this.store.getActiveEnvironment();

    try {
      clipboard.writeText(
        this.prepareExport({
          data: cloneDeep(
            environment.routes.find(route => route.uuid === routeUUID)
          ),
          subject: 'route'
        })
      );
      this.toastService.addToast(
        'success',
        Messages.EXPORT_ROUTE_CLIPBOARD_SUCCESS
      );
      this.eventsService.analyticsEvents.next(AnalyticsEvents.EXPORT_CLIPBOARD);
    } catch (error) {
      this.toastService.addToast('error', Errors.EXPORT_ROUTE_CLIPBOARD_ERROR);
    }
  }

  /**
   * Load data from JSON file and import
   */
  public async importFromFile() {
    const dialogResult = await this.dialog.showOpenDialog(
      this.BrowserWindow.getFocusedWindow(),
      {
        filters: [{ name: 'JSON', extensions: ['json'] }],
        title: 'Import from file (JSON)'
      }
    );

    if (dialogResult.filePaths && dialogResult.filePaths[0]) {
      fs.readFile(dialogResult.filePaths[0], 'utf-8', (error, fileContent) => {
        if (error) {
          this.toastService.addToast('error', Errors.IMPORT_ERROR);
        } else {
          const importedData: Export & OldExport = JSON.parse(fileContent);

          this.import(importedData);

          this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_FILE);
        }
      });
    }
  }

  /**
   * Load data from clipboard and import
   */
  public importFromClipboard() {
    try {
      const importedData: Export & OldExport = JSON.parse(clipboard.readText());

      this.import(importedData);

      this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_CLIPBOARD);
    } catch (error) {
      this.toastService.addToast('error', Errors.IMPORT_CLIPBOARD_ERROR);
    }
  }

  /**
   * Import an OpenAPI (v2/v3) file in Mockoon's format.
   * Append imported envs to the env array.
   */
  public async importOpenAPIFile() {
    const dialogResult = await this.dialog.showOpenDialog(
      this.BrowserWindow.getFocusedWindow(),
      { filters: [{ name: 'OpenAPI v2/v3', extensions: ['yaml', 'json'] }] }
    );

    if (dialogResult.filePaths && dialogResult.filePaths[0]) {
      const environment = await this.openAPIConverterService.import(
        dialogResult.filePaths[0]
      );

      if (environment) {
        this.store.update(addEnvironmentAction(environment));

        this.eventsService.analyticsEvents.next(AnalyticsEvents.IMPORT_FILE);
      }
    }
  }

  /**
   * Export all environments to an OpenAPI v3 file
   */
  public async exportOpenAPIFile() {
    const filePath = await this.openSaveDialog('Export all to JSON');

    try {
      fs.writeFile(
        filePath,
        this.openAPIConverterService.export(this.store.getActiveEnvironment()),
        error => {
          if (error) {
            this.toastService.addToast('error', Errors.EXPORT_ERROR);
          } else {
            this.toastService.addToast('success', Messages.EXPORT_SUCCESS);

            this.eventsService.analyticsEvents.next(
              AnalyticsEvents.EXPORT_FILE
            );
          }
        }
      );
    } catch (error) {
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
          data: Environment;
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

    dataToExport = data.map(dataItem => {
      // erase UUID to easier sharing
      dataItem =
        params.subject === 'environment'
          ? this.dataService.renewEnvironmentUUIDs(<Environment>dataItem, true)
          : this.dataService.renewRouteUUIDs(<Route>dataItem, true);

      return <ExportDataRoute | ExportDataEnvironment>{
        type: params.subject,
        item: dataItem
      };
    });

    return JSON.stringify(
      <Export>{
        source: `mockoon:${appVersion}`,
        data: dataToExport
      },
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

    dataToImport.data.forEach(data => {
      if (data.type === 'environment') {
        data.item = this.migrationService.migrateEnvironment(data.item);
        data.item = this.dataService.renewEnvironmentUUIDs(data.item);

        this.store.update(addEnvironmentAction(data.item));
      } else if (
        // routes cannot be migrated yet so we check the appVersion
        data.type === 'route' &&
        dataToImportVersion === appVersion
      ) {
        data.item = this.dataService.renewRouteUUIDs(data.item);

        // if has a current environment append imported route
        if (this.store.get('activeEnvironmentUUID')) {
          this.store.update(addRouteAction(data.item));
        } else {
          const newEnvironment: Environment = {
            ...this.schemasBuilderService.buildEnvironment(),
            routes: [data.item]
          };

          this.store.update(addEnvironmentAction(newEnvironment));
        }
      } else if (dataToImportVersion !== appVersion) {
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
          importedItem => {
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

  /**
   * Open the save dialog
   */
  private async openSaveDialog(title: string): Promise<string | null> {
    const dialogResult = await this.dialog.showSaveDialog(
      this.BrowserWindow.getFocusedWindow(),
      {
        filters: [{ name: 'JSON', extensions: ['json'] }],
        title: title
      }
    );

    if (dialogResult.canceled) {
      return null;
    }

    return dialogResult.filePath;
  }
}
