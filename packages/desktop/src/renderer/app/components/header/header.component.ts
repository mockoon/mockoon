import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from '@mockoon/cloud';
import { Environment } from '@mockoon/commons';
import { EMPTY, Observable, forkJoin, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
import {
  EnvironmentStatus,
  ViewsNameType
} from 'src/renderer/app/models/store.model';
import { DeployService } from 'src/renderer/app/services/deploy.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { RemoteConfigService } from 'src/renderer/app/services/remote-config.service';
import { SyncService } from 'src/renderer/app/services/sync.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { environment as env } from 'src/renderer/environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class HeaderComponent implements OnInit {
  public activeEnvironment$: Observable<Environment>;
  public user$: Observable<User>;
  public activeView$: Observable<ViewsNameType>;
  public activeEnvironmentState$: Observable<EnvironmentStatus>;
  public environmentLogs$: Observable<EnvironmentLog[]>;
  public os$: Observable<string>;
  public sync$ = this.store.select('sync');
  public tabs: {
    id: ViewsNameType;
    title: string;
    icon: string;
    count$?: Observable<number>;
  }[];
  public planLabels = {
    FREE: 'Free',
    SOLO: 'Solo',
    TEAM: 'Team',
    ENTERPRISE: 'Enterprise'
  };
  public tourIds = {
    ENV_LOGS: 'tour-environment-logs',
    ENV_PROXY: 'tour-environment-proxy'
  };
  public isDev = !env.production;
  public accountUrl = Config.accountUrl;

  constructor(
    private store: Store,
    private environmentsService: EnvironmentsService,
    private userService: UserService,
    private remoteConfigService: RemoteConfigService,
    private uiService: UIService,
    private syncService: SyncService,
    private toastsService: ToastsService,
    private deployService: DeployService
  ) {}

  ngOnInit() {
    this.os$ = from(MainAPI.invoke('APP_GET_OS'));
    this.user$ = this.store.select('user');
    this.activeView$ = this.store.select('activeView');
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeEnvironmentState$ = this.store.selectActiveEnvironmentStatus();
    this.environmentLogs$ = this.store.selectActiveEnvironmentLogs();

    this.tabs = [
      {
        id: 'ENV_ROUTES',
        title: 'Routes',
        icon: 'endpoints',
        count$: this.activeEnvironment$.pipe(
          map((environment) => (environment ? environment.routes.length : null))
        )
      },
      {
        id: 'ENV_DATABUCKETS',
        title: 'Data',
        icon: 'data',
        count$: this.activeEnvironment$.pipe(
          map((environment) => (environment ? environment.data.length : null))
        )
      },
      {
        id: 'ENV_HEADERS',
        title: 'Headers',
        icon: 'featured_play_list',
        count$: this.activeEnvironment$.pipe(
          map((environment) =>
            environment ? environment.headers.length : null
          )
        )
      },
      {
        id: 'ENV_CALLBACKS',
        title: 'Callbacks',
        icon: 'call_made',
        count$: this.activeEnvironment$.pipe(
          map((environment) =>
            environment ? environment.callbacks.length : null
          )
        )
      },
      {
        id: 'ENV_LOGS',
        title: 'Logs',
        icon: 'history',
        count$: this.environmentLogs$.pipe(
          map((environmentLogs) =>
            environmentLogs ? environmentLogs.length : null
          )
        )
      },
      {
        id: 'ENV_PROXY',
        title: 'Proxy',
        icon: 'security'
      },
      { id: 'ENV_SETTINGS', title: 'Settings', icon: 'settings' }
    ];
  }

  /**
   * Set the application active view (routes / logs / settings)
   */
  public setActiveView(viewName: ViewsNameType) {
    this.environmentsService.setActiveView(viewName);
  }

  /**
   * Toggle active environment running state (start/stop)
   */
  public toggleEnvironment() {
    this.environmentsService.toggleEnvironment();
  }

  public login() {
    this.userService.startLoginFlow();
  }

  public signup() {
    this.userService.startSignupFlow();
  }

  /**
   * Logout the user
   */
  public logout() {
    this.userService.logout().subscribe();
  }

  /**
   * Refresh the user account information
   */
  public refreshAccount() {
    forkJoin([
      this.userService.getUserInfo(),
      this.remoteConfigService.fetchConfig()
    ])
      .pipe(
        switchMap(() => this.deployService.getInstances()),
        catchError(() => EMPTY)
      )
      .subscribe(() => {
        this.toastsService.addToast('success', 'Account information refreshed');
      });
  }

  public disconnectSync() {
    this.syncService.disconnect();
  }

  public refreshAuthToken() {
    this.userService.refreshToken().subscribe();
  }

  /**
   * Open the command palette
   */
  public openCommandPalette() {
    this.uiService.openModal('commandPalette');
  }
}
