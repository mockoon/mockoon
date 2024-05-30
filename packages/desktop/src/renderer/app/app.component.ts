import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Environment } from '@mockoon/commons';
import { Observable, from, fromEvent, tap } from 'rxjs';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { BuildFullPath } from 'src/renderer/app/libs/utils.lib';
import { ContextMenuItemPayload } from 'src/renderer/app/models/context-menu.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { ViewsNameType } from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { ApiService } from 'src/renderer/app/services/api.service';
import { AppQuitService } from 'src/renderer/app/services/app-quit.services';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { RemoteConfigService } from 'src/renderer/app/services/remote-config.service';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { SyncService } from 'src/renderer/app/services/sync.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { TourService } from 'src/renderer/app/services/tour.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Store } from 'src/renderer/app/stores/store';
import { environment } from 'src/renderer/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent extends Logger implements OnInit {
  public activeEnvironment$: Observable<Environment>;
  public activeView$: Observable<ViewsNameType>;
  public scrollToBottom = this.uiService.scrollToBottom;
  public toasts$: Observable<Toast[]>;
  public os: string;

  constructor(
    private telemetryService: TelemetryService,
    private environmentsService: EnvironmentsService,
    private store: Store,
    protected toastService: ToastsService,
    private uiService: UIService,
    private apiService: ApiService,
    private settingsService: SettingsService,
    private appQuitService: AppQuitService,
    private userService: UserService,
    private title: Title,
    private tourService: TourService,
    private remoteConfigService: RemoteConfigService,
    private syncService: SyncService
  ) {
    super('[RENDERER][COMPONENT][APP] ', toastService);

    this.settingsService.monitorSettings().subscribe();
    this.settingsService.loadSettings().subscribe();
    this.settingsService.saveSettings().subscribe();
    this.environmentsService.loadEnvironments().subscribe();
    this.environmentsService.saveEnvironments().subscribe();
    this.environmentsService.listenServerTransactions().subscribe();
  }

  @HostListener('document:click')
  public documentClick() {
    this.telemetryService.sendEvent();
  }

  @HostListener('document:keydown', ['$event'])
  public globalKeyListener(event: KeyboardEvent) {
    if (
      ((event.ctrlKey && this.os !== 'darwin') ||
        (event.metaKey && this.os === 'darwin')) &&
      event.key.toLowerCase() === 'p'
    ) {
      this.uiService.openModal('commandPalette');
    }

    if (this.tourService.isInProgress()) {
      if (event.key === 'ArrowLeft') {
        this.tourService.previous();
      } else if (event.key === 'ArrowRight') {
        this.tourService.next();
      } else if (event.key === 'Escape') {
        this.tourService.stop();
      }
    }
  }

  ngOnInit() {
    this.appQuitService.init().subscribe();
    this.remoteConfigService.init().subscribe();
    this.userService.init().subscribe();
    this.syncService.init().subscribe();
    this.apiService.init();

    this.logMessage('info', 'INITIALIZING_APP');

    from(MainAPI.invoke('APP_GET_OS'))
      .pipe(
        tap((os) => {
          this.os = os;
        })
      )
      .subscribe();

    /**
     * Listen to online event to reload user and trigger the Firebase auth state change
     */
    fromEvent(window, 'online').subscribe(() => {
      this.userService.reloadUser();
    });

    this.telemetryService.init().subscribe();

    this.activeEnvironment$ = this.store.selectActiveEnvironment().pipe(
      tap((activeEnvironment) => {
        this.title.setTitle(
          `${environment.production ? '' : ' [DEV]'}Mockoon${
            activeEnvironment ? ' - ' + activeEnvironment.name : ''
          }`
        );
      })
    );
    this.activeView$ = this.store.select('activeView');
    this.toasts$ = this.store.select('toasts');
  }

  /**
   * Pass remove event to toast service
   */
  public removeToast(toastUUID: string) {
    this.toastService.removeToast(toastUUID);
  }

  /**
   * Handle navigation context menu item click
   *
   * @param payload
   */
  public contextMenuItemClicked(payload: ContextMenuItemPayload) {
    switch (payload.action) {
      case 'duplicateToCloud':
        this.environmentsService
          .duplicateToCloud(payload.subjectUUID)
          .subscribe();
        break;
      case 'convertToLocal':
        this.environmentsService
          .convertCloudToLocal(payload.subjectUUID)
          .subscribe();
        break;
      case 'duplicate':
        if (payload.subject === 'route') {
          this.environmentsService.duplicateRoute(
            payload.parentId,
            payload.subjectUUID
          );
        } else if (payload.subject === 'environment') {
          this.environmentsService
            .duplicateEnvironment(payload.subjectUUID)
            .subscribe();
        } else if (payload.subject === 'databucket') {
          this.environmentsService.duplicateDatabucket(payload.subjectUUID);
        } else if (payload.subject === 'callback') {
          this.environmentsService.duplicateCallback(payload.subjectUUID);
        }
        break;
      case 'copyJSON':
        this.copyJSONToClipboard(payload.subject, payload.subjectUUID);
        break;
      case 'copyFullPath':
        this.copyFullPathToClipboard(payload.subject, payload.subjectUUID);
        break;
      case 'copyDatabucketID':
        this.copyDatabucketID(payload.subject, payload.subjectUUID);
        break;
      case 'delete':
        if (payload.subject === 'route') {
          this.environmentsService.removeRoute(payload.subjectUUID);
        } else if (payload.subject === 'databucket') {
          this.environmentsService.removeDatabucket(payload.subjectUUID);
        } else if (payload.subject === 'folder') {
          this.environmentsService.removeFolder(payload.subjectUUID);
        } else if (payload.subject === 'callback') {
          this.environmentsService.removeCallback(payload.subjectUUID);
        }
        break;
      case 'deleteFromCloud':
        if (payload.subject === 'environment') {
          this.environmentsService
            .deleteFromCloud(payload.subjectUUID)
            .subscribe();
        }
        break;
      case 'add_crud_route':
        if (payload.subject === 'folder') {
          this.environmentsService.addCRUDRoute(payload.subjectUUID);
        }
        break;
      case 'add_http_route':
        if (payload.subject === 'folder') {
          this.environmentsService.addHTTPRoute(payload.subjectUUID);
        }
        break;
      case 'add_folder':
        if (payload.subject === 'folder') {
          this.environmentsService.addFolder(payload.subjectUUID);
        }
        break;
      case 'close':
        this.environmentsService
          .closeEnvironment(payload.subjectUUID)
          .subscribe();
        break;
      case 'toggle':
        if (payload.subject === 'route') {
          this.environmentsService.toggleRoute(payload.subjectUUID);
        }
        if (payload.subject === 'folder') {
          this.environmentsService.toggleFolder(payload.subjectUUID);
        }
        break;
      case 'duplicateToEnv':
        this.startEntityDuplicationToAnotherEnvironment(
          payload.subjectUUID,
          payload.subject
        );
        break;
      case 'showInFolder':
        if (payload.subject === 'environment') {
          this.environmentsService.showEnvironmentFileInFolder(
            payload.subjectUUID
          );
        }
        break;
      case 'move':
        if (payload.subject === 'environment') {
          this.environmentsService
            .moveEnvironmentFileToFolder(payload.subjectUUID)
            .subscribe();
        }
        break;
    }
  }

  /**
   * Export an environment/route to the clipboard
   *
   * @param subject
   * @param subjectUUID
   */
  private copyJSONToClipboard(subject: DataSubject, subjectUUID: string) {
    if (subject === 'environment') {
      this.environmentsService.copyEnvironmentToClipboard(subjectUUID);
    } else if (subject === 'route') {
      this.environmentsService.copyRouteToClipboard(subjectUUID);
    }
  }

  /**
   * Copy an API endpoint full path to the clipboard
   *
   * @param subject
   * @param subjectUUID
   */
  private copyFullPathToClipboard(subject: DataSubject, subjectUUID: string) {
    if (subject === 'route') {
      const activeEnvironment = this.store.getActiveEnvironment();
      const route = this.store.getRouteByUUID(subjectUUID);

      MainAPI.send(
        'APP_WRITE_CLIPBOARD',
        BuildFullPath(activeEnvironment, route)
      );
    }
  }

  private copyDatabucketID(subject: DataSubject, subjectUUID: string) {
    if (subject === 'databucket') {
      const databucket = this.store.getDatabucketByUUID(subjectUUID);

      MainAPI.send('APP_WRITE_CLIPBOARD', databucket.id);
    }
  }

  /**
   * Trigger entity movement flow
   */
  private startEntityDuplicationToAnotherEnvironment(
    subjectUUID: string,
    subject: DataSubject
  ) {
    this.environmentsService.startEntityDuplicationToAnotherEnvironment(
      subjectUUID,
      subject
    );
  }
}
