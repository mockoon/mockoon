import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { DataBucket, DataBucketDefault } from '@mockoon/commons';
import { Observable, Subject, filter, map, merge, takeUntil, tap } from 'rxjs';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-databuckets',
  templateUrl: './environment-databuckets.component.html',
  styleUrls: ['./environment-databuckets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentDatabucketsComponent implements OnInit, OnDestroy {
  public hasDatabuckets$: Observable<boolean>;
  public activeDatabucket$: Observable<DataBucket>;
  public activeDatabucketForm: UntypedFormGroup;
  public focusableInputs = FocusableInputs;
  public bodyEditorConfig$: Observable<any>;
  public scrollToBottom = this.uiService.scrollToBottom;
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private store: Store,
    private environmentsService: EnvironmentsService,
    private formBuilder: UntypedFormBuilder
  ) {}

  ngOnInit() {
    this.hasDatabuckets$ = this.store.selectActiveEnvironment().pipe(
      filter((environment) => !!environment),
      map((environment) => environment.data.length > 0)
    );
    this.activeDatabucket$ = this.store.selectActiveDatabucket();
    this.bodyEditorConfig$ = this.store.select('bodyEditorConfig');
    this.initForms();
    this.initFormValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public copyToClipboard(databucketId: string) {
    MainAPI.send('APP_WRITE_CLIPBOARD', databucketId);
  }

  private initForms() {
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
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active route changes to reset the form
    this.activeDatabucket$
      .pipe(
        filter((databucket) => !!databucket),
        this.store.distinctUUIDOrForce(),
        takeUntil(this.destroy$)
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
}
