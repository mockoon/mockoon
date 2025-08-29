import { NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { NewOpenAPIConverter } from '@mockoon/commons';
import { catchError, EMPTY, filter, Observable, switchMap, tap } from 'rxjs';
import { EditorComponent } from 'src/renderer/app/components/editor/editor.component';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { NgbTooltip } from '../../../../../../node_modules/@ng-bootstrap/ng-bootstrap/tooltip/tooltip';

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
    NgbTooltip,
    NgClass
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
    content: new FormControl<string>('')
  });
  public taskInProgress = signal(true);

  constructor(
    private uiService: UIService,
    private httpClient: HttpClient,
    private loggerService: LoggerService
  ) {
    this.importForm
      .get('url')
      .valueChanges.pipe(
        filter(
          (url) => url && url.length > 0 && url.match(/^https?:\/\/.+/) !== null
        ),
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
        })
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
        })
      )
      .subscribe();
  }

  public import() {
    const converter = new NewOpenAPIConverter();

    converter
      .convertFromOpenAPI(this.importForm.get('content').value)
      .then((conversionResult) => {
        console.log(conversionResult);
      });
  }

  public onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    this.importForm.get('file').setValue(file);
  }

  public close() {
    this.uiService.closeModal('openapiImport');
  }

  public fetchOpenAPI() {}
}
