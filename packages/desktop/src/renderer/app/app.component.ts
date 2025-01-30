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
import { ViewsNameType } from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { AppQuitService } from 'src/renderer/app/services/app-quit.services';
import { DeployService } from 'src/renderer/app/services/deploy.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
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
    private mainApiService: MainApiService,
    private settingsService: SettingsService,
    private appQuitService: AppQuitService,
    private userService: UserService,
    private title: Title,
    private tourService: TourService,
    private remoteConfigService: RemoteConfigService,
    private syncService: SyncService,
    private deployService: DeployService
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
    this.deployService.init().subscribe();
    this.mainApiService.init();

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
}
