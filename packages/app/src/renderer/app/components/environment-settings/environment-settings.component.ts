import { AsyncPipe, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup
} from '@angular/forms';
import { Environment, EnvironmentDefault } from '@mockoon/commons';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, combineLatest, merge } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { TitleSeparatorComponent } from 'src/renderer/app/components/title-separator/title-separator.component';
import { ToggleComponent } from 'src/renderer/app/components/toggle/toggle.component';
import { InputNumberDirective } from 'src/renderer/app/directives/input-number.directive';
import { ValidPathDirective } from 'src/renderer/app/directives/valid-path.directive';
import { buildApiUrl } from 'src/renderer/app/libs/utils.lib';
import { ToggleItems } from 'src/renderer/app/models/common.model';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-environment-settings',
  templateUrl: './environment-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    TitleSeparatorComponent,
    InputNumberDirective,
    ValidPathDirective,
    SvgComponent,
    NgbTooltip,
    ToggleComponent,
    AsyncPipe
  ]
})
export class EnvironmentSettingsComponent implements OnInit, OnDestroy {
  private formBuilder = inject(UntypedFormBuilder);
  private environmentsService = inject(EnvironmentsService);
  private store = inject(Store);
  private dialogsService = inject(DialogsService);

  public activeEnvironment$: Observable<Environment>;
  public instanceUrl$: Observable<string>;
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
  public isWeb = Config.isWeb;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.instanceUrl$ = combineLatest([
      this.activeEnvironment$,
      this.store.select('deployInstances')
    ]).pipe(
      map(([environment, deployInstances]) => {
        const instance = deployInstances.find(
          (deployInstance) =>
            deployInstance.environmentUuid === environment.uuid
        );

        const urls = buildApiUrl({ environment, instance });

        return this.isWeb ? urls.webUrl : urls.localUrl;
      })
    );
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
        tap((filePaths) => {
          if (filePaths[0]) {
            this.activeEnvironmentForm
              .get(['tlsOptions', target])
              .setValue(filePaths[0]);
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
