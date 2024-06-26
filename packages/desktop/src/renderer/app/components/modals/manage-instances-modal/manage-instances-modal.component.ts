import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from '@mockoon/cloud';
import { BehaviorSubject, Observable, map } from 'rxjs';
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
  public taskInProgress$ = new BehaviorSubject<boolean>(false);
  public instances$ = this.store.select('deployInstances');
  public environmentList$: Observable<{ [environmentUuid in string]: true }>;
  public user$: Observable<User>;
  public instancesDropdownMenuItems: DropdownMenuComponent['items'] = [
    {
      label: 'Re-deploy',
      icon: 'refresh',
      twoSteps: false,
      action: ({ environmentUuid }: dropdownMenuPayload) => {}
    },
    {
      label: 'Delete',
      icon: 'delete',
      twoSteps: true,
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.taskInProgress$.next(true);

        this.deployService.stop(environmentUuid).subscribe(() => {
          this.taskInProgress$.next(false);
        });
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
    this.user$ = this.store.select('user');
    this.environmentList$ = this.store.select('environments').pipe(
      map((environments) => {
        return environments.reduce((environmentList, environment) => {
          environmentList[environment.uuid] = true;

          return environmentList;
        }, {});
      })
    );
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

  public copyToClipboard(url: string) {
    MainAPI.send('APP_WRITE_CLIPBOARD', url);
  }

  public navigateToEnvironment(environmentUuid: string, event: MouseEvent) {
    // keep to avoid app close
    event.preventDefault();
    this.environmentsService.setActiveEnvironment(environmentUuid);

    this.uiService.closeModal('manageInstances');
  }
}
