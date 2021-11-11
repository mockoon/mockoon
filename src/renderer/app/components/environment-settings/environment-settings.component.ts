import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Environment, EnvironmentDefault } from '@mockoon/commons';
import { merge, Observable, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-settings',
  templateUrl: './environment-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentSettingsComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public activeEnvironmentForm: FormGroup;
  public Infinity = Infinity;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private environmentsService: EnvironmentsService,
    private store: Store
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();

    this.initForms();
    this.initFormValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /**
   * Init active environment form and subscribe to changes
   */
  private initForms() {
    this.activeEnvironmentForm = this.formBuilder.group({
      name: [EnvironmentDefault.name],
      port: [EnvironmentDefault.port],
      endpointPrefix: [EnvironmentDefault.endpointPrefix],
      latency: [EnvironmentDefault.latency],
      https: [EnvironmentDefault.https],
      localhostOnly: [false],
      cors: [EnvironmentDefault.cors]
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(
      ...Object.keys(this.activeEnvironmentForm.controls).map((controlName) =>
        this.activeEnvironmentForm.get(controlName).valueChanges.pipe(
          map((newValue) => {
            if (controlName === 'localhostOnly') {
              return {
                hostname: newValue === true ? '127.0.0.1' : '0.0.0.0'
              };
            }

            return {
              [controlName]: newValue
            };
          })
        )
      )
    )
      .pipe(
        tap((newProperty) => {
          this.environmentsService.updateActiveEnvironment(newProperty);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active environment changes to reset the form
    this.activeEnvironment$
      .pipe(
        filter((environment) => !!environment),
        distinctUntilChanged(),
        tap((activeEnvironment) => {
          this.activeEnvironmentForm.setValue(
            {
              name: activeEnvironment.name,
              port: activeEnvironment.port,
              endpointPrefix: activeEnvironment.endpointPrefix,
              latency: activeEnvironment.latency,
              https: activeEnvironment.https,
              localhostOnly: activeEnvironment.hostname === '127.0.0.1',
              cors: activeEnvironment.cors
            },
            { emitEvent: false }
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
