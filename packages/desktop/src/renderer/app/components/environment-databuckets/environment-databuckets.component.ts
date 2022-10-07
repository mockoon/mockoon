import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { DataBucket, DataBucketDefault, Environment } from '@mockoon/commons';
import {
  distinctUntilKeyChanged,
  filter,
  map,
  merge,
  Observable,
  Subject,
  takeUntil,
  tap
} from 'rxjs';
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
  public activeEnvironment$: Observable<Environment>;
  public activeDatabucket$: Observable<DataBucket>;
  public activeDatabucketForm: FormGroup;
  public form: FormGroup;
  public focusableInputs = FocusableInputs;
  public bodyEditorConfig$: Observable<any>;
  public scrollToBottom = this.uiService.scrollToBottom;
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private store: Store,
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder
  ) {}

  public get databuckets() {
    return this.form.get('databuckets') as FormArray;
  }

  ngOnInit() {
    this.activeDatabucket$ = this.store.selectActiveDatabucket();
    this.bodyEditorConfig$ = this.store.select('bodyEditorConfig');
    this.initForms();
    this.initFormValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
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
        distinctUntilKeyChanged('uuid'),
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
