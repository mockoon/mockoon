import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DeployInstance, DeployInstanceVisibility, User } from '@mockoon/cloud';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subscription,
  catchError,
  tap
} from 'rxjs';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { ToggleItems } from 'src/renderer/app/models/common.model';
import { DeployService } from 'src/renderer/app/services/deploy.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-deploy-instance-modal',
  templateUrl: './deploy-instance-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeployInstanceModalComponent
  extends Logger
  implements OnInit, OnDestroy
{
  public payload$ = this.eventsService.deployModalPayload$;
  public deployInProgress$ = new BehaviorSubject<boolean>(false);
  public instance$ = new BehaviorSubject<DeployInstance>(null);
  public user$: Observable<User>;
  public optionsForm = this.formBuilder.group({
    visibility: this.formBuilder.control<DeployInstanceVisibility>(
      DeployInstanceVisibility.PRIVATE,
      Validators.required
    )
  });
  public rulesOperators: ToggleItems = [
    {
      value: DeployInstanceVisibility.PRIVATE,
      label: 'PRIVATE'
    },
    {
      value: DeployInstanceVisibility.PUBLIC,
      label: 'PUBLIC'
    }
  ];
  private payloadSubscription: Subscription;

  constructor(
    private uiService: UIService,
    private store: Store,
    private environmentsService: EnvironmentsService,
    private eventsService: EventsService,
    private deployService: DeployService,
    protected toastService: ToastsService,
    private formBuilder: FormBuilder
  ) {
    super('[RENDERER][COMPONENT][DEPLOY-INSTANCE-MODAL] ', toastService);
  }

  ngOnInit() {
    this.payloadSubscription = this.payload$.subscribe();
    this.user$ = this.store.select('user');
  }

  ngOnDestroy() {
    this.payloadSubscription.unsubscribe();
  }

  public close() {
    this.uiService.closeModal('deploy', false);
  }

  public deploy(user: User) {
    if (user.deployInstancesQuotaUsed >= user.deployInstancesQuota) {
      this.logMessage('error', 'CLOUD_DEPLOY_QUOTA_EXCEEDED', {
        quota: user.deployInstancesQuota
      });

      return;
    }

    this.deployInProgress$.next(true);

    this.deployService
      .deploy(
        this.payload$.value.environmentUuid,
        this.optionsForm.getRawValue()
      )
      .pipe(
        tap((newInstance) => {
          this.deployInProgress$.next(false);

          if (newInstance) {
            this.instance$.next(newInstance);
          }
        }),
        catchError(() => {
          this.deployInProgress$.next(false);

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
}
