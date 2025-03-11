import {
  AsyncPipe,
  NgFor,
  NgIf,
  NgSwitch,
  NgSwitchCase
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Environment } from '@mockoon/commons';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { Observable, from, fromEvent, tap } from 'rxjs';
import { EnvironmentCallbacksComponent } from 'src/renderer/app/components/environment-callbacks/environment-callbacks.component';
import { EnvironmentDatabucketsComponent } from 'src/renderer/app/components/environment-databuckets/environment-databuckets.component';
import { EnvironmentHeadersComponent } from 'src/renderer/app/components/environment-headers/environment-headers.component';
import { EnvironmentLogsComponent } from 'src/renderer/app/components/environment-logs/environment-logs.component';
import { EnvironmentProxyComponent } from 'src/renderer/app/components/environment-proxy/environment-proxy.component';
import { EnvironmentRoutesComponent } from 'src/renderer/app/components/environment-routes/environment-routes.component';
import { EnvironmentSettingsComponent } from 'src/renderer/app/components/environment-settings/environment-settings.component';
import { FooterComponent } from 'src/renderer/app/components/footer/footer.component';
import { HeaderComponent } from 'src/renderer/app/components/header/header.component';
import { EnvironmentsMenuComponent } from 'src/renderer/app/components/menus/environments-menu/environments-menu.component';
import { TourComponent } from 'src/renderer/app/components/tour/tour.component';
import { ViewsNameType } from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { AppQuitService } from 'src/renderer/app/services/app-quit.services';
import { DeployService } from 'src/renderer/app/services/deploy.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { MainApiListenerService } from 'src/renderer/app/services/main-api-listener.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { RemoteConfigService } from 'src/renderer/app/services/remote-config.service';
import { ServerService } from 'src/renderer/app/services/server.service';
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
  imports: [
    NgFor,
    NgbToast,
    EnvironmentsMenuComponent,
    HeaderComponent,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    EnvironmentRoutesComponent,
    EnvironmentDatabucketsComponent,
    EnvironmentCallbacksComponent,
    EnvironmentHeadersComponent,
    EnvironmentLogsComponent,
    EnvironmentProxyComponent,
    EnvironmentSettingsComponent,
    FooterComponent,
    TourComponent,
    AsyncPipe
  ]
})
export class AppComponent implements OnInit {
  public activeEnvironment$: Observable<Environment>;
  public activeView$: Observable<ViewsNameType>;
  public scrollToBottom = this.uiService.scrollToBottom;
  public toasts$: Observable<Toast[]>;
  public os: string;

  constructor(
    private telemetryService: TelemetryService,
    private environmentsService: EnvironmentsService,
    private store: Store,
    private toastService: ToastsService,
    private uiService: UIService,
    private mainApiListenerService: MainApiListenerService,
    private settingsService: SettingsService,
    private appQuitService: AppQuitService,
    private userService: UserService,
    private title: Title,
    private tourService: TourService,
    private remoteConfigService: RemoteConfigService,
    private syncService: SyncService,
    private deployService: DeployService,
    private serverService: ServerService,
    private mainApiService: MainApiService,
    private loggerService: LoggerService
  ) {
    this.settingsService.monitorSettings().subscribe();
    this.settingsService.loadSettings().subscribe();
    this.settingsService.saveSettings().subscribe();
    this.environmentsService.loadEnvironments().subscribe();
    this.environmentsService.saveEnvironments().subscribe();
    this.environmentsService.listenServerTransactions().subscribe();
    this.appQuitService.init().subscribe();
    this.remoteConfigService.init().subscribe();
    this.userService.init().subscribe();
    this.syncService.init().subscribe();
    this.deployService.init().subscribe();
    this.mainApiListenerService.init();
    this.serverService.init().subscribe();

    if (environment.web) {
      this.userService.webAuthHandler().subscribe();
    }
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
      event.preventDefault();
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
    this.loggerService.logMessage('info', 'INITIALIZING_APP');

    from(this.mainApiService.invoke('APP_GET_OS'))
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
