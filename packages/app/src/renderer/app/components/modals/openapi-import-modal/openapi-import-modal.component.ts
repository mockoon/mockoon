import { AsyncPipe, LowerCasePipe, UpperCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { OpenApiConverter } from '@mockoon/commons';
import {
  catchError,
  combineLatest,
  debounceTime,
  EMPTY,
  filter,
  finalize,
  from,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  tap
} from 'rxjs';
import { EditorComponent } from 'src/renderer/app/components/editor/editor.component';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { OpenApiReimportPreviewState } from 'src/renderer/app/models/openapi.model';
import { OpenApiImportModalPayload } from 'src/renderer/app/models/ui.model';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { updateOpenApiImportAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
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
    AsyncPipe,
    UpperCasePipe,
    LowerCasePipe,
    FormField
  ]
})
export class OpenapiImportModalComponent {
  private uiService = inject(UIService);
  private httpClient = inject(HttpClient);
  private loggerService = inject(LoggerService);
  private environmentsService = inject(EnvironmentsService);
  private dialogsService = inject(DialogsService);
  private mainApiService = inject(MainApiService);
  private dataService = inject(DataService);
  private store = inject(Store);

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
  public reimportPreview$: Observable<OpenApiReimportPreviewState> =
    combineLatest([
      this.modalPayload$,
      this.importForm
        .get('content')
        .valueChanges.pipe(
          startWith(this.importForm.get('content').value),
          debounceTime(250)
        )
    ]).pipe(
      switchMap(([modalPayload, content]) => {
        if (
          !this.isReimport(modalPayload) ||
          !modalPayload?.environmentUuid ||
          !content?.trim()
        ) {
          return of<OpenApiReimportPreviewState>({ status: 'idle' });
        }

        return this.environmentsService
          .planOpenAPIReimport(modalPayload.environmentUuid, content)
          .pipe(
            tap((reimportPlan) => {
              this.store.update(
                updateOpenApiImportAction({
                  reimportPlan
                })
              );
              this.choiceForm().value.set(
                [
                  ...reimportPlan.routesToAdd.map((route) => route.uuid),
                  ...reimportPlan.responsesToAdd.flatMap(({ newResponses }) =>
                    newResponses.map((r) => r.uuid)
                  )
                ].reduce(
                  (choices, uuid) => {
                    choices[uuid] = true;

                    return choices;
                  },
                  {} as Record<string, boolean>
                )
              );
            }),
            map((reimportPlan) => {
              return {
                status: 'ready',
                plan: reimportPlan
              } as OpenApiReimportPreviewState;
            }),
            startWith({ status: 'loading' } as OpenApiReimportPreviewState),
            catchError((error) => {
              return of<OpenApiReimportPreviewState>({
                status: 'error',
                error: error?.message || 'Unable to build preview'
              });
            })
          );
      })
    );
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
  public choiceForm = form(signal<Record<string, boolean>>({}));

  constructor() {
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

          this.store.update(
            updateOpenApiImportAction({
              reimportPlan: null
            })
          );

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

  public submit(modalPayload: OpenApiImportModalPayload | null) {
    if (!modalPayload) {
      return;
    }

    if (this.isReimport(modalPayload)) {
      this.reimport(modalPayload.environmentUuid);

      return;
    }

    this.import(modalPayload.cloud);
  }

  public getPreviewPlan(reimportPreview: OpenApiReimportPreviewState | null) {
    return reimportPreview?.status === 'ready' ? reimportPreview.plan : null;
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

  private reimport(environmentUuid?: string) {
    if (!environmentUuid) {
      return;
    }

    this.taskInProgress.set(true);

    this.environmentsService.reimportOpenAPIRoutes(
      environmentUuid,
      this.store.get('openApiImport').reimportPlan,
      this.choiceForm().value()
    );

    this.store.update(
      updateOpenApiImportAction({
        reimportPlan: null
      })
    );
    this.taskInProgress.set(false);
    this.close();
  }

  private isReimport(modalPayload: OpenApiImportModalPayload | null) {
    return (modalPayload?.mode ?? 'import') === 'reimport';
  }

  public close() {
    this.uiService.closeModal('openApiImport');
    this.store.update(
      updateOpenApiImportAction({
        reimportPlan: null
      })
    );
  }
}
