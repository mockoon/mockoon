import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, catchError, map, tap } from 'rxjs';
import { Logger } from 'src/renderer/app/classes/logger';
import { DropdownMenuComponent } from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { DeployService } from 'src/renderer/app/services/deploy.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

type dropdownMenuPayload = { environmentUuid: string };

@Component({
  selector: 'app-manage-instances-modal',
  templateUrl: './manage-instances-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageInstancesModalComponent extends Logger implements OnInit {
  public environmentUuid$ = this.uiService.getModalPayload$('manageInstances');
  public taskInProgress$ = new BehaviorSubject<boolean>(false);
  public instances$ = this.store.select('deployInstances');
  public environmentList$: Observable<{ [environmentUuid in string]: true }>;
  public user$ = this.store.select('user');
  public isCloudEnabled$ = this.user$.pipe(
    map((user) => user && user.plan !== 'FREE')
  );
  public deployEnvList$: Observable<DropdownMenuComponent['items']> = this.store
    .select('environments')
    .pipe(
      map((environments) =>
        environments.map((environment) => ({
          label: environment.name,
          icon: null,
          twoSteps: false,
          action: () => {
            this.uiService.closeModal('manageInstances');
            this.uiService.openModal('deploy', environment.uuid);
          }
        }))
      )
    );
  public cloudPlansURL = Config.cloudPlansURL;
  public instancesDropdownMenuItems: DropdownMenuComponent['items'] = [
    {
      label: 'Re-deploy',
      icon: 'refresh',
      twoSteps: false,
      // entry disabled if environment is closed
      disabled$: ({ environmentUuid }: dropdownMenuPayload) =>
        this.store
          .select('environments')
          .pipe(
            map(
              (environments) =>
                !environments.find(
                  (environment) => environment.uuid === environmentUuid
                )
            )
          ),
      disabledLabel: 'Re-deploy (environment is closed)',
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.uiService.openModal('deploy', environmentUuid);
      }
    },
    {
      label: 'Delete',
      icon: 'delete',
      twoSteps: true,
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      action: ({ environmentUuid }: dropdownMenuPayload) => {
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
  ];

  constructor(
    private uiService: UIService,
    private store: Store,
    private environmentsService: EnvironmentsService,
    private deployService: DeployService,
    protected toastService: ToastsService
  ) {
    super('[RENDERER][COMPONENT][MANAGE-INSTANCE-MODAL] ', toastService);
  }

  ngOnInit() {
    this.environmentList$ = this.store.select('environments').pipe(
      map((environments) => {
        return environments.reduce((environmentList, environment) => {
          environmentList[environment.uuid] = true;

          return environmentList;
        }, {});
      })
    );

    this.deployService.getInstances().subscribe();
  }

  public close() {
    this.uiService.closeModal('manageInstances', false);
  }

  /**
   * Open the account page in the default browser
   */
  public account() {
    MainAPI.send('APP_OPEN_EXTERNAL_LINK', Config.accountURL);
  }

  public copyToClipboard(text: string) {
    MainAPI.send('APP_WRITE_CLIPBOARD', text);
  }

  public navigateToEnvironment(environmentUuid: string, event: MouseEvent) {
    // keep to avoid app close
    event.preventDefault();
    this.environmentsService.setActiveEnvironment(environmentUuid);

    this.uiService.closeModal('manageInstances');
  }
}
