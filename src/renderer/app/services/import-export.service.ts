import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { OpenAPIConverterService } from 'src/renderer/app/services/openapi-converter.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({ providedIn: 'root' })
export class ImportExportService extends Logger {
  constructor(
    protected toastService: ToastsService,
    private store: Store,
    private openAPIConverterService: OpenAPIConverterService,
    private dialogsService: DialogsService,
    private environmentsService: EnvironmentsService
  ) {
    super('[SERVICE][IMPORT-EXPORT]', toastService);
  }

  /**
   * Import an OpenAPI (v2/v3) file in Mockoon's format.
   * Append imported envs to the env array.
   */
  public async importOpenAPIFile() {
    const filePath = await this.dialogsService.showOpenDialog(
      'Import OpenAPI specification file',
      'openapi'
    );

    this.logMessage('info', 'OPENAPI_IMPORT', {
      filePath
    });

    if (filePath) {
      try {
        const environment = await this.openAPIConverterService.import(filePath);
        if (environment) {
          this.environmentsService
            .addEnvironment(environment)
            .pipe(
              tap(() => {
                this.logMessage('info', 'OPENAPI_IMPORT_SUCCESS', {
                  environmentName: environment.name
                });
              })
            )
            .subscribe();
        }
      } catch (error) {
        this.logMessage('error', 'OPENAPI_IMPORT_ERROR', {
          error,
          filePath
        });
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

    this.logMessage('info', 'OPENAPI_EXPORT', {
      environmentUUID: activeEnvironment.uuid
    });

    const filePath = await this.dialogsService.showSaveDialog(
      'Export environment to OpenAPI JSON'
    );

    // dialog not cancelled
    if (filePath) {
      try {
        await MainAPI.invoke(
          'APP_WRITE_FILE',
          filePath,
          await this.openAPIConverterService.convertToOpenAPIV3(
            activeEnvironment
          )
        );

        this.logMessage('info', 'OPENAPI_EXPORT_SUCCESS', {
          environmentName: activeEnvironment.name
        });
      } catch (error) {
        this.logMessage('error', 'OPENAPI_EXPORT_ERROR', {
          error,
          environmentUUID: activeEnvironment.uuid
        });
      }
    }
  }
}
