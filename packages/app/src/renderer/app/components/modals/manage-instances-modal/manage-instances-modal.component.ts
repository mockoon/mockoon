import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, EMPTY, Observable, catchError, map, tap } from 'rxjs';
import {
  DropdownMenuComponent,
  DropdownMenuItem
} from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { HideAfterDirective } from 'src/renderer/app/directives/hide-after.directive';
import { DeployService } from 'src/renderer/app/services/deploy.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

type dropdownMenuPayload = { environmentUuid: string };

@Component({
  selector: 'app-manage-instances-modal',
  templateUrl: './manage-instances-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HideAfterDirective,
    SvgComponent,
    NgbTooltip,
    DropdownMenuComponent,
    AsyncPipe,
    SpinnerComponent
  ]
})
export class ManageInstancesModalComponent implements OnInit {
  private uiService = inject(UIService);
  private store = inject(Store);
  private environmentsService = inject(EnvironmentsService);
  private deployService = inject(DeployService);
  private mainApiService = inject(MainApiService);
  private loggerService = inject(LoggerService);
  private userService = inject(UserService);

  public payload$ = this.uiService.getModalPayload$('manageInstances');
  public taskInProgress$ = new BehaviorSubject<boolean>(false);
  public instances$ = this.store.select('deployInstances');
  public availableRegionsLabels$ = this.store
    .selectRemoteConfig('regions')
    .pipe(
      map((regions) =>
        regions.reduce((regionLabels, region) => {
          regionLabels[region.value] = region.label;

          return regionLabels;
        }, {})
      )
    );
  public environmentList$: Observable<Record<string, true>>;
  public user$ = this.store.select('user');
  public accountUrl = Config.accountUrl;
  public isCloudEnabled$ = this.user$.pipe(
    map((user) => user && user.plan !== 'FREE')
  );
  public deployEnvList$: Observable<DropdownMenuItem[]> = this.store
    .select('environments')
    .pipe(
      map((environments) =>
        environments
          // only allow cloud envs deployments
          .filter((environment) => this.store.getIsEnvCloud(environment.uuid))
          .map((environment) => ({
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
  public instancesDropdownMenuItems: DropdownMenuItem[] = [
    {
      label: 'Manage deployment',
      icon: 'server_settings',
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
                ) || !this.store.getIsEnvCloud(environmentUuid)
            )
          ),
      disabledLabel$: ({ environmentUuid }: dropdownMenuPayload) =>
        this.store.select('environments').pipe(
          map((environments) => {
            if (
              !environments.find(
                (environment) => environment.uuid === environmentUuid
              )
            ) {
              return 'Manage deployment (environment is closed)';
            } else if (!this.store.getIsEnvCloud(environmentUuid)) {
              return 'Manage deployment (not available for local environments)';
            }

            return '';
          })
        ),
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.uiService.openModal('deploy', environmentUuid);
      }
    },
    {
      label: 'Stop',
      icon: 'stop',
      twoSteps: true,
      confirmIcon: 'error',
      confirmLabel: 'Confirm',
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.taskInProgress$.next(true);

        this.deployService
          .stop(environmentUuid)
          .pipe(
            tap(() => {
              this.taskInProgress$.next(false);
            }),
            catchError(() => {
              this.loggerService.logMessage('error', 'CLOUD_DEPLOY_STOP_ERROR');

              this.taskInProgress$.next(false);

              return EMPTY;
            })
          )
          .subscribe();
      }
    }
  ];

  ngOnInit() {
    this.environmentList$ = this.store.select('environments').pipe(
      map((environments) => {
        return environments.reduce((environmentList, environment) => {
          environmentList[environment.uuid] = true;

          return environmentList;
        }, {});
      })
    );

    if (this.payload$.getValue()?.refresh) {
      this.deployService.getInstances(true).subscribe();
      this.userService.getUserInfo(true).subscribe();
    }
  }

  public close() {
    this.uiService.closeModal('manageInstances', false);
  }

  public copyToClipboard(text: string) {
    this.mainApiService.send('APP_WRITE_CLIPBOARD', text);
  }

  public navigateToEnvironment(environmentUuid: string, event: MouseEvent) {
    // keep to avoid app close
    event.preventDefault();
    this.environmentsService.setActiveEnvironment(environmentUuid);

    this.uiService.closeModal('manageInstances');
  }
}
