import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Environment, EnvironmentDefault } from '@mockoon/commons';
import { Observable, Subject, merge } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { ToggleItems } from 'src/renderer/app/models/common.model';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-settings',
  templateUrl: './environment-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentSettingsComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public activeEnvironmentForm: UntypedFormGroup;
  public tlsOptionsFormGroup: UntypedFormGroup;
  public Infinity = Infinity;
  public certTypes: ToggleItems = [
    {
      value: 'CERT',
      label: 'CERT'
    },
    {
      value: 'PFX',
      label: 'PFX'
    }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private environmentsService: EnvironmentsService,
    private store: Store,
    private dialogsService: DialogsService
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
   * Open file browsing dialog
   */
  public browseFiles(target: string) {
    this.dialogsService
      .showOpenDialog('Choose a file', null, false)
      .pipe(
        tap((filePath) => {
          if (filePath) {
            this.activeEnvironmentForm
              .get(['tlsOptions', target])
              .setValue(filePath);
          }
        })
      )
      .subscribe();
  }

  /**
   * Init active environment form and subscribe to changes
   */
  private initForms() {
    this.tlsOptionsFormGroup = this.formBuilder.group({
      enabled: [EnvironmentDefault.tlsOptions.enabled],
      type: [EnvironmentDefault.tlsOptions.type],
      pfxPath: [EnvironmentDefault.tlsOptions.pfxPath],
      certPath: [EnvironmentDefault.tlsOptions.certPath],
      keyPath: [EnvironmentDefault.tlsOptions.keyPath],
      caPath: [EnvironmentDefault.tlsOptions.caPath],
      passphrase: [EnvironmentDefault.tlsOptions.passphrase]
    });

    this.activeEnvironmentForm = this.formBuilder.group({
      name: [EnvironmentDefault.name],
      hostname: [EnvironmentDefault.hostname],
      port: [EnvironmentDefault.port],
      endpointPrefix: [EnvironmentDefault.endpointPrefix],
      latency: [EnvironmentDefault.latency],
      tlsOptions: this.tlsOptionsFormGroup,
      cors: [EnvironmentDefault.cors]
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(
      ...Object.keys(this.activeEnvironmentForm.controls).map((controlName) =>
        this.activeEnvironmentForm.get(controlName).valueChanges.pipe(
          map((newValue) => ({
            [controlName]: newValue
          }))
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
        this.store.distinctUUIDOrForce(),
        tap((activeEnvironment) => {
          this.activeEnvironmentForm.setValue(
            {
              name: activeEnvironment.name,
              hostname: activeEnvironment.hostname,
              port: activeEnvironment.port,
              endpointPrefix: activeEnvironment.endpointPrefix,
              latency: activeEnvironment.latency,
              tlsOptions: activeEnvironment.tlsOptions,
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
