import { AsyncPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DeployInstanceVisibility, DeployRegions, User } from '@mockoon/cloud';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import {
  BehaviorSubject,
  catchError,
  combineLatestWith,
  debounceTime,
  EMPTY,
  filter,
  map,
  switchMap,
  tap,
  withLatestFrom
} from 'rxjs';
import { CustomSelectComponent } from 'src/renderer/app/components/custom-select/custom-select.component';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { ToggleComponent } from 'src/renderer/app/components/toggle/toggle.component';
import { ToggleItems } from 'src/renderer/app/models/common.model';
import { DeployService } from 'src/renderer/app/services/deploy.service';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import {
  updateEnvironmentStatusAction,
  updateSettingsAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-deploy-instance-modal',
  templateUrl: './deploy-instance-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SvgComponent,
    NgbTooltip,
    ToggleComponent,
    NgClass,
    AsyncPipe,
    SpinnerComponent,
    CustomSelectComponent
  ]
})
export class DeployInstanceModalComponent implements OnInit {
  private uiService = inject(UIService);
  private store = inject(Store);
  private deployService = inject(DeployService);
  private formBuilder = inject(FormBuilder);
  private mainApiService = inject(MainApiService);
  private loggerService = inject(LoggerService);
  public deployInProgress$ = new BehaviorSubject<boolean>(false);
  public subdomainCheckInProgress$ = new BehaviorSubject<boolean>(false);
  private environmentUuid$ = this.uiService.getModalPayload$('deploy');
  public existingInstance$ = this.environmentUuid$.pipe(
    switchMap((environmentUuid) =>
      this.store
        .select('deployInstances')
        .pipe(map((instances) => ({ environmentUuid, instances })))
    ),
    map(({ environmentUuid, instances }) =>
      instances.find((instance) => instance.environmentUuid === environmentUuid)
    )
  );
  public instanceExists$ = this.existingInstance$.pipe(
    map((existingInstance) => {
      if (existingInstance) {
        this.optionsForm.patchValue({
          subdomain: existingInstance.subdomain,
          visibility: existingInstance.visibility
        });

        this.optionsForm.get('region').disable();
      } else {
        this.optionsForm.get('region').enable();
      }

      return !!existingInstance;
    })
  );
  public user$ = this.store.select('user');
  public accountUrl = Config.accountUrl;
  public isWeb = Config.isWeb;
  public stopInstanceRequested = signal(false);
  public optionsForm = this.formBuilder.group({
    subdomain: this.formBuilder.control<string>(null, {
      validators: [
        Validators.minLength(5),
        Validators.maxLength(50),
        Validators.pattern(/^(?!-)[a-z0-9-]*(?<!-)$/)
      ]
    }),
    visibility: this.formBuilder.control<DeployInstanceVisibility>(
      DeployInstanceVisibility.PRIVATE,
      Validators.required
    ),
    region: this.formBuilder.control<DeployRegions>(null)
  });
  public visibilityToggle: ToggleItems = [
    {
      value: DeployInstanceVisibility.PRIVATE,
      label: 'private'
    },
    {
      value: DeployInstanceVisibility.PUBLIC,
      label: 'public'
    }
  ];
  public environment$ = this.environmentUuid$.pipe(
    map((environmentUuid) => this.store.getEnvironmentByUUID(environmentUuid))
  );
  public remoteConfig$ = this.store.selectRemoteConfig().pipe(
    withLatestFrom(
      this.store.select('settings').pipe(filter((settings) => !!settings))
    ),
    tap(([remoteConfig, settings]) => {
      this.optionsForm
        .get('region')
        .setValue(
          settings.deployPreferredRegion ?? remoteConfig.defaultRegion ?? null
        );
    }),
    map(([remoteConfig]) => ({
      regions: remoteConfig.regions,
      defaultRegion: remoteConfig.defaultRegion
    }))
  );
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // check subdomain availability (not using async validators to use debounce and stuff)
    this.optionsForm
      .get('subdomain')
      .valueChanges.pipe(
        combineLatestWith(this.existingInstance$),
        filter(
          ([subdomain, existingInstance]) =>
            subdomain &&
            subdomain.length >= 5 &&
            this.optionsForm.get('subdomain').valid &&
            existingInstance?.subdomain !== subdomain
        ),
        tap(() => {
          this.optionsForm.get('subdomain').setErrors(null);

          this.subdomainCheckInProgress$.next(true);
        }),
        debounceTime(1000),
        switchMap(([subdomain, existingInstance]) =>
          this.deployService
            .checkSubdomainAvailability(
              subdomain,
              existingInstance?.environmentUuid ?? null
            )
            .pipe(
              tap(() => {
                this.subdomainCheckInProgress$.next(false);
              }),
              map((isAvailable) => {
                if (!isAvailable) {
                  this.optionsForm
                    .get('subdomain')
                    .setErrors({ subdomainTaken: true });
                }
              })
            )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Save last region used
    this.optionsForm
      .get('region')
      .valueChanges.pipe(
        // filter initial null value
        filter((region) => !!region),
        tap((region) => {
          this.store.update(
            updateSettingsAction({
              deployPreferredRegion: region
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  public close() {
    this.uiService.closeModal('deploy', false);
  }

  public deploy(user: User, environmentUuid: string) {
    if (
      this.optionsForm.invalid ||
      this.deployInProgress$.value ||
      this.subdomainCheckInProgress$.value
    ) {
      return;
    }

    const instances = this.store.get('deployInstances');
    const existingInstance = instances.find(
      (instance) => instance.environmentUuid === environmentUuid
    );

    // can deploy if the user has not reached the quota or if the environment is already deployed (redeploy)
    if (
      user.deployInstancesQuotaUsed >= user.deployInstancesQuota &&
      !existingInstance
    ) {
      this.loggerService.logMessage('error', 'CLOUD_DEPLOY_QUOTA_EXCEEDED', {
        quota: user.deployInstancesQuota
      });

      return;
    }

    // Since v9.4.0 local envs cannot be deployed anymore
    if (!this.store.getIsEnvCloud(environmentUuid)) {
      return;
    }

    this.deployInProgress$.next(true);

    this.deployService
      .deploy(
        environmentUuid,
        this.optionsForm.getRawValue(),
        !!existingInstance
      )
      .pipe(
        tap((newInstance) => {
          this.deployInProgress$.next(false);

          if (newInstance) {
            // only update the main running state if on the web app
            if (this.isWeb) {
              this.store.update(
                updateEnvironmentStatusAction(
                  { running: true },
                  environmentUuid
                )
              );
            }

            this.uiService.closeModal('deploy', false);
            this.uiService.openModal('manageInstances', {
              environmentUuid,
              refresh: false
            });
          }
        }),
        catchError((error) => {
          if (error.status === 413) {
            this.loggerService.logMessage(
              'error',
              'CLOUD_DEPLOY_START_TOO_BIG_ERROR'
            );
          } else if (error.status === 409) {
            this.loggerService.logMessage(
              'error',
              'CLOUD_DEPLOY_START_SUBDOMAIN_TAKEN'
            );
          } else if (error.status === 422) {
            this.loggerService.logMessage(
              'error',
              'CLOUD_DEPLOY_ALREADY_IN_PROGRESS'
            );
          } else {
            this.loggerService.logMessage('error', 'CLOUD_DEPLOY_START_ERROR');
          }

          this.deployInProgress$.next(false);

          return EMPTY;
        })
      )
      .subscribe();
  }

  public copyToClipboard(url: string) {
    this.mainApiService.send('APP_WRITE_CLIPBOARD', url);
  }

  public deleteInstance(environmentUuid: string) {
    if (this.stopInstanceRequested()) {
      this.deployInProgress$.next(true);

      this.deployService
        .stop(environmentUuid)
        .pipe(
          tap(() => {
            this.deployInProgress$.next(false);
            this.stopInstanceRequested.set(false);
          }),
          catchError(() => {
            this.loggerService.logMessage('error', 'CLOUD_DEPLOY_STOP_ERROR');

            this.deployInProgress$.next(false);

            return EMPTY;
          })
        )
        .subscribe();
    } else {
      this.stopInstanceRequested.set(!this.stopInstanceRequested());
    }
  }
}
