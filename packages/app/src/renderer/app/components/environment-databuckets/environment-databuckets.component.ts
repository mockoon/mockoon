import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup
} from '@angular/forms';
import {
  DataBucket,
  DataBucketDefault,
  ProcessedDatabucketWithoutValue
} from '@mockoon/commons';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable, filter, map, merge, tap } from 'rxjs';
import { EditorComponent } from 'src/renderer/app/components/editor/editor.component';
import { DatabucketsMenuComponent } from 'src/renderer/app/components/menus/databuckets-menu/databuckets-menu.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { FocusOnEventDirective } from 'src/renderer/app/directives/focus-event.directive';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { ServerService } from 'src/renderer/app/services/server.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-databuckets',
  templateUrl: './environment-databuckets.component.html',
  styleUrls: ['./environment-databuckets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatabucketsMenuComponent,
    FormsModule,
    ReactiveFormsModule,
    FocusOnEventDirective,
    NgIf,
    EditorComponent,
    NgbTooltip,
    SvgComponent,
    AsyncPipe
  ]
})
export class EnvironmentDatabucketsComponent {
  private uiService = inject(UIService);
  private store = inject(Store);
  private environmentsService = inject(EnvironmentsService);
  private formBuilder = inject(UntypedFormBuilder);
  private serverService = inject(ServerService);
  private mainApiService = inject(MainApiService);
  public hasDatabuckets$: Observable<boolean>;
  public activeDatabucket$: Observable<DataBucket>;
  public activeDatabucketForm: UntypedFormGroup;
  public focusableInputs = FocusableInputs;
  public bodyEditorConfig$: Observable<any>;
  public processedDatabuckets$: Observable<
    Record<string, ProcessedDatabucketWithoutValue>
  >;
  public scrollToBottom = this.uiService.scrollToBottom;

  constructor() {
    this.hasDatabuckets$ = this.store.selectActiveEnvironment().pipe(
      filter((environment) => !!environment),
      map((environment) => environment.data.length > 0)
    );
    this.activeDatabucket$ = this.store.selectActiveDatabucket();
    this.processedDatabuckets$ =
      this.store.selectActiveEnvironmentProcessedDatabuckets();
    this.bodyEditorConfig$ = this.store.select('bodyEditorConfig');

    this.activeDatabucketForm = this.formBuilder.group({
      name: [DataBucketDefault.name],
      documentation: [DataBucketDefault.documentation],
      value: [DataBucketDefault.value]
    });

    // send new activeDatabucketForm values to the store, one by one
    merge(
      ...Object.keys(this.activeDatabucketForm.controls).map((controlName) =>
        this.activeDatabucketForm
          .get(controlName)
          .valueChanges.pipe(map((newValue) => ({ [controlName]: newValue })))
      )
    )
      .pipe(
        tap((newProperty) => {
          this.environmentsService.updateActiveDatabucket(newProperty);
        }),
        takeUntilDestroyed()
      )
      .subscribe();

    // subscribe to active route changes to reset the form
    this.activeDatabucket$
      .pipe(
        filter((databucket) => !!databucket),
        this.store.distinctUUIDOrForce(),
        takeUntilDestroyed()
      )
      .subscribe((activeDatabucket) => {
        this.activeDatabucketForm.patchValue(
          {
            name: activeDatabucket.name,
            documentation: activeDatabucket.documentation,
            value: activeDatabucket.value
          },
          { emitEvent: false }
        );
      });
  }

  public copyToClipboard(databucketId: string) {
    this.mainApiService.send('APP_WRITE_CLIPBOARD', databucketId);
  }

  public showDatabucketValue(
    databucketUuid: string,
    validJson: boolean,
    databucketName: string
  ) {
    const activeEnvironmentUuid = this.store.get('activeEnvironmentUUID');

    this.serverService
      .getProcessedDatabucketValue(activeEnvironmentUuid, databucketUuid)
      .subscribe((d) => {
        this.uiService.openModal('editor', {
          title: `"${databucketName}" databucket value`,
          subtitle:
            'This is the current in-memory value of the processed databucket content',
          text: validJson ? JSON.stringify(d, null, 2) : d
        });
      });
  }
}
