import { Injectable } from '@angular/core';
import { EMPTY, from } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({ providedIn: 'root' })
export class ImportExportService extends Logger {
  constructor(
    protected toastService: ToastsService,
    private store: Store,
    private dialogsService: DialogsService,
    private environmentsService: EnvironmentsService,
    private dataService: DataService
  ) {
    super('[RENDERER][SERVICE][IMPORT-EXPORT] ', toastService);
  }

  /**
   * Import an OpenAPI (v2/v3) file in Mockoon's format.
   * Append imported envs to the env array.
   */
  public importOpenAPIFile() {
    return this.dialogsService
      .showOpenDialog('Import OpenAPI specification file', 'openapi', false)
      .pipe(
        switchMap((filePath) => {
          if (filePath) {
            return from(
              MainAPI.invoke(
                'APP_OPENAPI_CONVERT_FROM',
                filePath,
                this.dataService.getNewEnvironmentPort()
              )
            );
          }

          return EMPTY;
        }),
        switchMap((environment) =>
          this.environmentsService.addEnvironment({ environment }).pipe(
            tap(() => {
              this.logMessage('info', 'OPENAPI_IMPORT_SUCCESS', {
                environmentName: environment.name
              });
            })
          )
        ),
        catchError((error) => {
          this.logMessage('error', 'OPENAPI_IMPORT_ERROR', {
            error
          });

          return EMPTY;
        })
      );
  }

  /**
   * Export active environment to an OpenAPI v3 file
   */
  public exportOpenAPIFile() {
    const activeEnvironment = this.store.getActiveEnvironment();

    if (!activeEnvironment) {
      return EMPTY;
    }

    return this.dialogsService
      .showSaveDialog('Export environment to OpenAPI JSON', false)
      .pipe(
        switchMap((filePath) => {
          if (filePath) {
            return from(
              MainAPI.invoke('APP_OPENAPI_CONVERT_TO', activeEnvironment)
            ).pipe(
              map((data) => ({
                data,
                filePath
              }))
            );
          }

          return EMPTY;
        }),
        switchMap(({ data, filePath }) =>
          from(MainAPI.invoke('APP_WRITE_FILE', filePath, data)).pipe(
            tap(() => {
              this.logMessage('info', 'OPENAPI_EXPORT_SUCCESS', {
                environmentName: activeEnvironment.name
              });
            })
          )
        ),
        catchError((error) => {
          this.logMessage('error', 'OPENAPI_EXPORT_ERROR', {
            error,
            environmentName: activeEnvironment.name,
            environmentUUID: activeEnvironment.uuid
          });

          return EMPTY;
        })
      );
  }
}
