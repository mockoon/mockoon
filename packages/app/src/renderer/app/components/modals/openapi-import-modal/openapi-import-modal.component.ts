import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { OpenApiConverter } from '@mockoon/commons';
import {
  catchError,
  EMPTY,
  filter,
  finalize,
  from,
  map,
  Observable,
  startWith,
  switchMap,
  tap
} from 'rxjs';
import { EditorComponent } from 'src/renderer/app/components/editor/editor.component';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-openapi-import-modal',
  templateUrl: './openapi-import-modal.component.html',
  styleUrls: ['openapi-import-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EditorComponent,
    FormsModule,
    ReactiveFormsModule,
    SpinnerComponent,
    SvgComponent,
    AsyncPipe
  ]
})
export class OpenapiImportModalComponent {
  public defaultEditorConfig = {
    ...defaultEditorOptions,
    options: { ...defaultEditorOptions.options, useWorker: true }
  };
  public importForm = new FormGroup({
    url: new FormControl<string>(''),
    file: new FormControl<File | null>(null),
    content: new FormControl<string>('', { validators: [Validators.required] })
  });
  public taskInProgress = signal(false);
  public modalPayload$ = this.uiService.getModalPayload$('openApiImport');
  public bodyEditorMode$ = this.importForm.get('content').valueChanges.pipe(
    startWith(defaultEditorOptions.mode),
    map((content) => {
      const trimmedContent = content.trim();
      if (trimmedContent.startsWith('{')) {
        return 'json';
      } else {
        return 'yaml';
      }
    })
  );
  public isWeb = Config.isWeb;

  constructor(
    private uiService: UIService,
    private httpClient: HttpClient,
    private loggerService: LoggerService,
    private environmentsService: EnvironmentsService,
    private dialogsService: DialogsService,
    private mainApiService: MainApiService,
    private dataService: DataService
  ) {
    this.importForm
      .get('url')
      .valueChanges.pipe(
        filter((url) => {
          if (!url || url.length === 0) return false;

          try {
            const parsed = new URL(url);

            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
          } catch {
            return false;
          }
        }),
        tap(() => {
          this.taskInProgress.set(true);
        }),
        switchMap((url) =>
          this.httpClient.get(url, { responseType: 'text' }).pipe(
            catchError((error) => {
              this.importForm.get('url').setErrors({ invalid: true });
              this.loggerService.logMessage(
                'error',
                'OPENAPI_IMPORT_URL_ERROR',
                {
                  error
                }
              );

              this.taskInProgress.set(false);

              return EMPTY;
            })
          )
        ),
        tap((text) => {
          this.importForm.get('content').setValue(text);
          this.taskInProgress.set(false);
        }),
        takeUntilDestroyed()
      )
      .subscribe();

    this.importForm
      .get('file')
      .valueChanges.pipe(
        tap(() => {
          this.taskInProgress.set(true);
        }),
        switchMap((file) => {
          const reader = new FileReader();
          reader.readAsText(file);

          return new Observable<string>((observer) => {
            reader.onload = () => {
              observer.next(reader.result as string);
              observer.complete();
            };
            reader.onerror = () => {
              observer.error(reader.error);
            };
          });
        }),
        tap((text) => {
          this.importForm.get('content').setValue(text);
          this.taskInProgress.set(false);
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  /**
   * Import the OpenAPI specification from the form content (editor)
   *
   * @param cloud
   */
  public import(cloud: boolean) {
    this.taskInProgress.set(true);

    const converter = new OpenApiConverter();

    from(
      converter.convertFromOpenAPI(
        this.importForm.get('content').value,
        this.dataService.getNewEnvironmentPort()
      )
    )
      .pipe(
        switchMap((environment) => {
          return (
            cloud
              ? this.environmentsService.addCloudEnvironment(environment, true)
              : this.environmentsService.addEnvironment({
                  environment,
                  promptSave: true,
                  setActive: true,
                  cloud: false
                })
          ).pipe(
            map(() => environment),
            finalize(() => {
              this.taskInProgress.set(false);
            })
          );
        }),
        tap((environment) => {
          this.loggerService.logMessage('info', 'OPENAPI_IMPORT_SUCCESS', {
            environmentName: environment.name
          });

          this.taskInProgress.set(false);

          this.close();
        }),
        catchError((error) => {
          this.loggerService.logMessage('error', 'OPENAPI_IMPORT_ERROR', {
            error
          });

          this.taskInProgress.set(false);

          return EMPTY;
        })
      )
      .subscribe();
  }

  /**
   * Read a file from the filesystem
   *
   * Used in desktop mode only as it uses the main process to open the
   * file dialog and read the file
   * @returns
   */
  public readFile() {
    this.taskInProgress.set(true);

    return this.dialogsService
      .showOpenDialog('Import OpenAPI specification file', 'openapi', false)
      .pipe(
        switchMap((filePaths) => {
          if (filePaths) {
            return from(
              this.mainApiService.invoke('APP_READ_FILE', filePaths[0])
            );
          }

          this.taskInProgress.set(false);

          return EMPTY;
        }),
        tap((data) => {
          this.importForm.get('content').setValue(data);

          this.taskInProgress.set(false);
        }),
        catchError((error) => {
          this.loggerService.logMessage('error', 'OPENAPI_IMPORT_READ_ERROR', {
            error
          });

          this.taskInProgress.set(false);

          return EMPTY;
        })
      )
      .subscribe();
  }

  public onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    this.importForm.get('file').setValue(file);
  }

  public close() {
    this.uiService.closeModal('openApiImport');
  }
}
