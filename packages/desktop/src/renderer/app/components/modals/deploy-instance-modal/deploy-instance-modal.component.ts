import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DeployInstanceVisibility, User } from '@mockoon/cloud';
import { Environment } from '@mockoon/commons';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  map,
  switchMap,
  tap
} from 'rxjs';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { ToggleItems } from 'src/renderer/app/models/common.model';
import { DeployService } from 'src/renderer/app/services/deploy.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-deploy-instance-modal',
  templateUrl: './deploy-instance-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeployInstanceModalComponent extends Logger implements OnInit {
  public taskInProgress$ = new BehaviorSubject<boolean>(false);
  public instanceExists$: Observable<boolean>;
  public user$: Observable<User>;
  public optionsForm = this.formBuilder.group({
    visibility: this.formBuilder.control<DeployInstanceVisibility>(
      DeployInstanceVisibility.PRIVATE,
      Validators.required
    )
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
  public environment$: Observable<Environment>;
  private environmentUuid$ = this.uiService.getModalPayload$('deploy');

  constructor(
    private uiService: UIService,
    private store: Store,
    private deployService: DeployService,
    protected toastService: ToastsService,
    private formBuilder: FormBuilder
  ) {
    super('[RENDERER][COMPONENT][DEPLOY-INSTANCE-MODAL] ', toastService);
  }

  ngOnInit() {
    this.environment$ = this.environmentUuid$.pipe(
      map((environmentUuid) => this.store.getEnvironmentByUUID(environmentUuid))
    );
    this.user$ = this.store.select('user');
    this.instanceExists$ = this.environmentUuid$.pipe(
      switchMap((environmentUuid) =>
        this.store
          .select('deployInstances')
          .pipe(map((instances) => ({ environmentUuid, instances })))
      ),
      map(({ environmentUuid, instances }) => {
        const existingInstance = instances.find(
          (instance) => instance.environmentUuid === environmentUuid
        );

        if (existingInstance) {
          this.optionsForm.patchValue({
            visibility: existingInstance.visibility
          });
        }

        return !!existingInstance;
      })
    );
  }

  public close() {
    this.uiService.closeModal('deploy', false);
  }

  public deploy(user: User, environmentUuid: string) {
    const instances = this.store.get('deployInstances');
    const existingInstance = instances.find(
      (instance) => instance.environmentUuid === environmentUuid
    );

    // can deploy if the user has not reached the quota or if the environment is already deployed (redeploy)
    if (
      user.deployInstancesQuotaUsed >= user.deployInstancesQuota &&
      !existingInstance
    ) {
      this.logMessage('error', 'CLOUD_DEPLOY_QUOTA_EXCEEDED', {
        quota: user.deployInstancesQuota
      });

      return;
    }

    this.taskInProgress$.next(true);

    this.deployService
      .deploy(
        environmentUuid,
        this.optionsForm.getRawValue(),
        !!existingInstance
      )
      .pipe(
        tap((newInstance) => {
          this.taskInProgress$.next(false);

          if (newInstance) {
            this.uiService.closeModal('deploy', false);
            this.uiService.openModal('manageInstances', environmentUuid);
          }
        }),
        catchError((error) => {
          if (error.status === 413) {
            this.logMessage('error', 'CLOUD_DEPLOY_START_TOO_BIG_ERROR');
          } else {
            this.logMessage('error', 'CLOUD_DEPLOY_START_ERROR');
          }

          this.taskInProgress$.next(false);

          return EMPTY;
        })
      )
      .subscribe();
  }

  /**
   * Open the account page in the default browser
   */
  public account() {
    MainAPI.send('APP_OPEN_EXTERNAL_LINK', Config.accountURL);
  }

  public copyToClipboard(url: string) {
    MainAPI.send('APP_WRITE_CLIPBOARD', url);
  }

  public deleteInstance(environmentUuid: string) {
    this.taskInProgress$.next(true);

    this.deployService
      .stop(environmentUuid)
      .pipe(
        tap(() => {
          this.taskInProgress$.next(false);
        }),
        catchError(() => {
          this.logMessage('error', 'CLOUD_DEPLOY_STOP_ERROR');

          this.taskInProgress$.next(false);

          return EMPTY;
        })
      )
      .subscribe();
  }
}
