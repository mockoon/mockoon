import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import { Environment } from '@mockoon/commons';
import { from, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { ChangelogModalComponent } from 'src/renderer/app/components/modals/changelog-modal/changelog-modal.component';
import { SettingsModalComponent } from 'src/renderer/app/components/modals/settings-modal/settings-modal.component';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { ContextMenuItemPayload } from 'src/renderer/app/models/context-menu.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { ViewsNameType } from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { AnalyticsService } from 'src/renderer/app/services/analytics.service';
import { ApiService } from 'src/renderer/app/services/api.service';
import { AppQuitService } from 'src/renderer/app/services/app-quit.services';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent extends Logger implements OnInit, AfterViewInit {
  @ViewChild('changelogModal')
  public changelogModal: ChangelogModalComponent;
  @ViewChild('settingsModal')
  public settingsModal: SettingsModalComponent;
  public activeEnvironment$: Observable<Environment>;
  public activeView$: Observable<ViewsNameType>;
  public scrollToBottom = this.uiService.scrollToBottom;
  public toasts$: Observable<Toast[]>;
  public os: string;

  constructor(
    private analyticsService: AnalyticsService,
    private telemetryService: TelemetryService,
    private environmentsService: EnvironmentsService,
    private eventsService: EventsService,
    private store: Store,
    protected toastService: ToastsService,
    private uiService: UIService,
    private apiService: ApiService,
    private settingsService: SettingsService,
    private appQuitService: AppQuitService
  ) {
    super('[COMPONENT][APP]', toastService);
    this.settingsService.loadSettings().subscribe();
    this.settingsService.saveSettings().subscribe();
    this.environmentsService.loadEnvironments().subscribe();
    this.environmentsService.saveEnvironments().subscribe();
  }

  @HostListener('document:click')
  public documentClick() {
    this.telemetryService.sendEvent();
  }

  @HostListener('document:keydown', ['$event'])
  public focusRouteFilterInput(event: KeyboardEvent) {
    if (
      ((event.ctrlKey && this.os !== 'darwin') ||
        (event.metaKey && this.os === 'darwin')) &&
      event.shiftKey &&
      event.key.toLowerCase() === 'f'
    ) {
      this.eventsService.focusInput.next(FocusableInputs.ROUTE_FILTER);
    }
  }

  ngOnInit() {
    this.appQuitService.init().subscribe();

    this.logMessage('info', 'INITIALIZING_APP');

    from(MainAPI.invoke('APP_GET_OS'))
      .pipe(
        tap((os) => {
          this.os = os;
        })
      )
      .subscribe();

    this.telemetryService.init().subscribe();

    this.analyticsService.init();
    this.eventsService.analyticsEvents.next({
      type: 'pageview',
      pageName: '/'
    });

    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeView$ = this.store.select('activeView');
    this.toasts$ = this.store.select('toasts');
  }

  ngAfterViewInit() {
    this.apiService.init(this.changelogModal, this.settingsModal);
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
      case 'duplicate':
        if (payload.subject === 'route') {
          this.environmentsService.duplicateRoute(payload.subjectUUID);
        } else if (payload.subject === 'environment') {
          this.environmentsService
            .duplicateEnvironment(payload.subjectUUID)
            .subscribe();
        }
        break;
      case 'clipboard':
        this.copyToClipboard(payload.subject, payload.subjectUUID);
        break;
      case 'delete':
        if (payload.subject === 'route') {
          this.environmentsService.removeRoute(payload.subjectUUID);
        }
        break;
      case 'close':
        this.environmentsService
          .closeEnvironment(payload.subjectUUID)
          .subscribe();
        break;
      case 'toggle':
        if (payload.subject === 'route') {
          this.toggleRoute(payload.subjectUUID);
        }
        break;
      case 'duplicateToEnv':
        if (payload.subject === 'route') {
          this.startRouteDuplicationToAnotherEnvironment(payload.subjectUUID);
        }
        break;
      case 'showInFolder':
        if (payload.subject === 'environment') {
          this.environmentsService.showEnvironmentFileInFolder(
            payload.subjectUUID
          );
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
  public copyToClipboard(subject: DataSubject, subjectUUID: string) {
    if (subject === 'environment') {
      this.environmentsService.copyEnvironmentToClipboard(subjectUUID);
    } else if (subject === 'route') {
      this.environmentsService.copyRouteToClipboard(subjectUUID);
    }
  }

  /**
   * Enable/disable a route
   */
  private toggleRoute(routeUUID?: string) {
    this.environmentsService.toggleRoute(routeUUID);
  }

  /**
   * Trigger route movement flow
   */
  private startRouteDuplicationToAnotherEnvironment(routeUUID: string) {
    this.environmentsService.startRouteDuplicationToAnotherEnvironment(
      routeUUID
    );
  }
}
