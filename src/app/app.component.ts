import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ContextMenuItemPayload } from 'app/components/context-menu.component';
import { Config } from 'app/config';
import { Errors } from 'app/enums/errors.enum.js';
import { Alert, AlertService } from 'app/services/alert.service';
import { AnalyticsService } from 'app/services/analytics.service';
import { AuthService } from 'app/services/auth.service';
import { EnvironmentsService } from 'app/services/environments.service';
import { ContextMenuEventType, EventsService } from 'app/services/events.service';
import { ServerService } from 'app/services/server.service';
import { UpdateService } from 'app/services/update.service';
import { EnvironmentsType, EnvironmentType } from 'app/types/environment.type';
import { headerNames, headerValues, methods, RouteType, statusCodes, statusCodesExplanation } from 'app/types/route.type';
import 'brace/index';
import 'brace/mode/css';
import 'brace/mode/html.js';
import 'brace/mode/json.js';
import 'brace/mode/text.js';
import 'brace/mode/xml.js';
import { ipcRenderer, remote, shell } from 'electron';
import * as mimeTypes from 'mime-types';
import { DragulaService } from 'ng2-dragula';
import * as path from 'path';
import * as uuid from 'uuid/v1';
import '../assets/custom_theme.js';
const platform = require('os').platform();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  @ViewChild('routesMenu') private routesMenu: ElementRef;
  @ViewChild('environmentsMenu') private environmentsMenu: ElementRef;
  @ViewChild('headersTabContent') private headersTabContent: ElementRef;
  public environments: EnvironmentsType;
  public currentEnvironment: { environment: EnvironmentType, index: number } = null;
  public currentRoute: { route: RouteType, index: number } = null;
  public methods = methods;
  public statusCodes = statusCodes;
  public statusCodesExplanation = statusCodesExplanation;
  public saving = false;
  public editorConfig: any = {
    options: {
      fontSize: '1rem',
      wrap: 'free',
      showPrintMargin: false,
      tooltipFollowsMouse: false,
      useWorker: false
    },
    mode: 'json',
    theme: 'custom_theme'
  };
  public currentTab: 'RESPONSE' | 'HEADERS' | 'ENV_SETTINGS' = 'RESPONSE';
  public alerts: Alert[];
  public updateAvailable = false;
  public platform = platform;
  public headerNamesList = headerNames;
  public headerValuesList = headerValues;
  public getCustomHeader = this.serverService.getCustomHeader;
  private settingsModalOpened = false;
  private dialog = remote.dialog;
  private BrowserWindow = remote.BrowserWindow;

  constructor(
    public environmentsService: EnvironmentsService,
    private serverService: ServerService,
    private alertService: AlertService,
    private updateService: UpdateService,
    private analyticsService: AnalyticsService,
    private authService: AuthService,
    private eventsService: EventsService,
    private config: NgbTooltipConfig,
    private dragulaService: DragulaService
  ) {
    // tooltip config
    this.config.container = 'body';
    this.config.placement = 'bottom';

    // set listeners on main process messages
    ipcRenderer.on('keydown', (event, data) => {
      if (data.action === 'NEW_ENVIRONMENT') {
        this.addEnvironment();
      } else if (data.action === 'NEW_ROUTE') {
        this.addRoute();
      } else if (data.action === 'START_ENVIRONMENT') {
        if (this.currentEnvironment) {
          this.toggleEnvironment(this.currentEnvironment.environment);
        }
      } else if (data.action === 'DUPLICATE_ENVIRONMENT') {
        if (this.currentEnvironment) {
          this.duplicateEnvironment(this.currentEnvironment.index);
        }
      } else if (data.action === 'DUPLICATE_ROUTE') {
        if (this.currentRoute) {
          this.duplicateRoute(this.currentRoute.index);
        }
      } else if (data.action === 'DELETE_ENVIRONMENT') {
        if (this.currentEnvironment) {
          this.removeEnvironment(this.currentEnvironment.index);
        }
      } else if (data.action === 'DELETE_ROUTE') {
        if (this.currentRoute) {
          this.removeRoute(this.currentRoute.index);
        }
      } else if (data.action === 'PREVIOUS_ENVIRONMENT') {
        if (this.currentEnvironment) {
          this.selectEnvironment(this.currentEnvironment.index - 1);
        }
      } else if (data.action === 'NEXT_ENVIRONMENT') {
        if (this.currentEnvironment) {
          this.selectEnvironment(this.currentEnvironment.index + 1);
        }
      } else if (data.action === 'PREVIOUS_ROUTE') {
        if (this.currentRoute) {
          this.selectRoute(this.currentRoute.index - 1);
        }
      } else if (data.action === 'NEXT_ROUTE') {
        if (this.currentRoute) {
          this.selectRoute(this.currentRoute.index + 1);
        }
      } else if (data.action === 'OPEN_SETTINGS') {
        if (!this.settingsModalOpened) {
          this.settingsModalOpened = true;
          this.eventsService.settingsModalEvents.emit(true);
        }
      }
    });
  }

  ngOnInit() {
    // auth anonymously through firebase
    this.authService.auth();

    this.environmentsService.environmentsReady.subscribe((ready: true) => {
      this.environments = this.environmentsService.environments;

      // send first GA requests when env are ready
      this.analyticsService.collect({ type: 'pageview', pageName: '/' });
      this.analyticsService.collect({ type: 'event', category: 'application', action: 'start' });

      this.selectEnvironment(0);
    });

    this.alerts = this.alertService.alerts;

    // subscribe to update events
    this.updateService.updateAvailable.subscribe(() => {
      this.updateAvailable = true;
    });

    this.initDragMonitoring();
  }

  /**
   * Handle mouse wheel events on numbers fields
   */
  @HostListener('mousewheel', ['$event']) onMouseWheel(event: any) {
    // Mouse wheel on environment port
    if (event.target.name === 'environment.port') {
      event.preventDefault();

      const modifier = 1 * (Math.sign(event.wheelDeltaY));
      if (modifier > 0 || (modifier < 0 && this.currentEnvironment.environment.port !== 0)) {
        this.currentEnvironment.environment.port += modifier;
        this.environmentUpdated('port');
      }
    }

    // Mouse wheel on environment latency
    if (event.target.name === 'environment.latency') {
      event.preventDefault();

      const modifier = 1 * (Math.sign(event.wheelDeltaY));
      if (modifier > 0 || (modifier < 0 && this.currentEnvironment.environment.latency !== 0)) {
        this.currentEnvironment.environment.latency += modifier;
        this.environmentUpdated('envLatency');
      }
    }

    // Mouse wheel on route latency
    if (event.target.name === 'route.latency') {
      event.preventDefault();

      const modifier = 1 * (Math.sign(event.wheelDeltaY));
      if (modifier > 0 || (modifier < 0 && this.currentRoute.route.latency !== 0)) {
        this.currentRoute.route.latency += modifier;
        this.environmentUpdated('routeLatency');
      }
    }
  }

  /**
   * Trigger env/route re-selection when draging active route/env
   */
  public initDragMonitoring() {
    // on drop reselect if we moved a selected env/route
    this.dragulaService.drop.subscribe((value) => {
      if (value[0] === 'environmentsContainer') {
        const environmentIndex = this.environmentsService.findEnvironmentIndex(this.currentEnvironment.environment.uuid);
        console.log(environmentIndex)
        this.selectEnvironment(environmentIndex);
      } else if (value[0] === 'routesContainer') {
        const routeIndex = this.environmentsService.findRouteIndex(this.currentEnvironment.environment, this.currentRoute.route.uuid);
        console.log(routeIndex)
        this.selectRoute(routeIndex);
      }

      this.environmentUpdated('reorder', true);
    });
  }
  /**
   * Toggle environment running state (start/stop)
   *
   * @param environment - environment
   */
  public toggleEnvironment(environment: EnvironmentType) {
    if (environment) {
      if (environment.running) {
        this.serverService.stop(environment);

        this.analyticsService.collect({ type: 'event', category: 'server', action: 'stop' });

        if (environment.needRestart) {
          this.serverService.start(environment);
          this.analyticsService.collect({ type: 'event', category: 'server', action: 'restart' });
        }

        // if stopping or restarting, restart is not needed
        environment.needRestart = false;
      } else {
        this.serverService.start(environment);
        this.analyticsService.collect({ type: 'event', category: 'server', action: 'start' });
      }
    }
  }

  public selectEnvironment(environmentIndex: number) {
    // check if selection exists
    if (environmentIndex >= 0 && environmentIndex <= (this.environments.length - 1)) {
      this.currentEnvironment = { environment: this.environments[environmentIndex], index: environmentIndex };

      // select first route
      this.selectRoute(0);

      // auto scroll routes to top when navigating environments
      if (this.routesMenu) {
        this.routesMenu.nativeElement.scrollTop = 0;
      }

      this.analyticsService.collect({ type: 'event', category: 'navigate', action: 'environment' });
    }
  }

  public setCurrentTab(tabName: 'RESPONSE' | 'HEADERS' | 'ENV_SETTINGS') {
    this.currentTab = tabName;
  }

  public selectRoute(routeIndex: number) {
    // check if selection exists
    if (this.currentEnvironment.environment.routes.length > 0 && routeIndex >= 0 && routeIndex <= (this.currentEnvironment.environment.routes.length - 1)) {
      // go on first tab when switching route
      this.currentTab = 'RESPONSE';

      this.currentRoute = { route: this.currentEnvironment.environment.routes[routeIndex], index: routeIndex };

      this.changeEditorSettings();

      this.analyticsService.collect({ type: 'event', category: 'navigate', action: 'route' });
    } else {
      this.currentTab = 'ENV_SETTINGS';
      this.currentRoute = null;
    }
  }

  public addEnvironment() {
    const index = this.environmentsService.addEnvironment(() => {
      this.analyticsService.collect({ type: 'event', category: 'create', action: 'environment' });
    });

    this.selectEnvironment(index);

    // auto scroll environments to bottom when adding (wait for element to be in page)
    setTimeout(() => {
      this.environmentsMenu.nativeElement.scrollTop = this.environmentsMenu.nativeElement.scrollHeight;
    }, 0);
  }

  public addRoute() {
    if (this.currentEnvironment) {
      this.environmentUpdated('addRoute', false);

      const index = this.environmentsService.addRoute(this.currentEnvironment.environment, () => {
        this.analyticsService.collect({ type: 'event', category: 'create', action: 'route' });
      });

      this.selectRoute(index);

      // auto scroll routes to bottom when adding
      this.routesMenu.nativeElement.scrollTop = this.routesMenu.nativeElement.scrollHeight;
    }
  }


  /**
   * Function getting called each time a field is updated
   *
   * @param fieldUpdated - name of the update field
   * @param propagate - should propagate event to env service
   */
  public environmentUpdated(fieldUpdated: string = '', propagate = true) {
    this.currentEnvironment.environment.modifiedAt = new Date();

    // restart is not needed for some fields
    if (fieldUpdated !== 'name' &&
      fieldUpdated !== 'envLatency' &&
      fieldUpdated !== 'statusCode' &&
      fieldUpdated !== 'file' &&
      fieldUpdated !== 'routeCustomHeader' &&
      fieldUpdated !== 'body'
    ) {
      if (this.currentEnvironment.environment.running) {
        this.currentEnvironment.environment.needRestart = this.currentEnvironment.environment.modifiedAt > this.currentEnvironment.environment.startedAt;
      }
    }

    if (fieldUpdated === 'routeCustomHeader') {
      this.changeEditorSettings();
    }

    if (propagate) {
      this.environmentsService.environmentUpdateEvents.next({
        environment: this.currentEnvironment.environment
      });
    }
  }

  /**
   * Remove route and navigate depending on remaining routes
   *
   * @param routeIndex
   */
  private removeRoute(routeIndex: number) {
    this.environmentUpdated('removeRoute', false);

    this.environmentsService.removeRoute(this.currentEnvironment.environment, routeIndex, () => {
      this.analyticsService.collect({ type: 'event', category: 'delete', action: 'route' });
    });

    // if same route than deleted one
    if (routeIndex === this.currentRoute.index) {
      // if there is still something to navigate to, navigate
      if (this.currentEnvironment.environment.routes.length > 0) {
        // select previous route or index 0 if currently on 0
        this.selectRoute((routeIndex === 0) ? 0 : routeIndex - 1);
      } else {
        this.currentTab = 'ENV_SETTINGS';
        this.currentRoute = null;
      }
    } else if (routeIndex < this.currentRoute.index) {
      // if an above route, select minus 1
      this.selectRoute(this.currentRoute.index - 1);
    }
  }

  /**
   * Remove environment and navigate depending on remaining environments
   *
   * @param environmentIndex
   */
  private removeEnvironment(environmentIndex: number) {
    this.environmentsService.removeEnvironment(environmentIndex);

    this.analyticsService.collect({ type: 'event', category: 'delete', action: 'environment' });

    // if same environment than deleted one
    if (environmentIndex === this.currentEnvironment.index) {
      // if there is still something to navigate to, navigate
      if (this.environments.length > 0) {
        // select previous environment or index 0 if currently on 0
        this.selectEnvironment((environmentIndex === 0) ? 0 : environmentIndex - 1);
      } else {
        // navigate to nothing
        this.currentEnvironment = null;
        this.currentRoute = null;
      }
    } else if (environmentIndex < this.currentEnvironment.index) {
      // if an above environment, select minus 1
      this.selectEnvironment(this.currentEnvironment.index - 1);
    }
  }

  /**
   * Open GET routes in the browser
   */
  public openRouteInBrowser() {
    if (this.currentEnvironment.environment.running) {
      let routeUrl = ((this.currentEnvironment.environment.https) ? 'https://' : 'http://') + 'localhost:' + this.currentEnvironment.environment.port + '/';

      if (this.currentEnvironment.environment.endpointPrefix) {
        routeUrl += this.currentEnvironment.environment.endpointPrefix + '/';
      }

      routeUrl += this.currentRoute.route.endpoint;

      shell.openExternal(routeUrl);

      this.analyticsService.collect({ type: 'event', category: 'link', action: 'route-in-browser' });
    }
  }

  public browseFiles(event) {
    this.dialog.showOpenDialog(this.BrowserWindow.getFocusedWindow(), {}, (file) => {
      if (file && file[0]) {
        const filePath = file[0];
        // if start with a dot, refuse (cannot serve with sendFile in Express)
        if (!/^\./i.test(path.basename(filePath))) {
          this.currentRoute.route.file = {
            path: filePath,
            filename: path.basename(filePath),
            mimeType: mimeTypes.lookup(filePath)
          };
          this.environmentUpdated('file');
        } else {
          this.alertService.showAlert('error', Errors.FILE_TYPE_NOT_SUPPORTED);
        }
      }
    });
  }

  public deleteFile() {
    this.currentRoute.route.file = null;
    this.environmentUpdated('file');
  }

  public addCustomHeader() {
    const lastCustomHeader = this.currentRoute.route.customHeaders[this.currentRoute.route.customHeaders.length - 1];

    if (lastCustomHeader.key !== '') {
      this.currentRoute.route.customHeaders.push({ uuid: uuid(), key: '', value: '' });
      this.environmentUpdated('routeCustomHeader');

      this.analyticsService.collect({ type: 'event', category: 'create', action: 'custom-header' });
    }

    // auto scroll routes to bottom when adding
    this.headersTabContent.nativeElement.scrollTop = this.headersTabContent.nativeElement.scrollHeight;
  }

  public removeCustomHeader(customHeaderUUID: string) {
    const customHeaderIndex = this.currentRoute.route.customHeaders.findIndex((customHeader: any) => {
      return customHeader.uuid === customHeaderUUID;
    });

    if (customHeaderIndex > -1) {
      this.currentRoute.route.customHeaders.splice(customHeaderIndex, 1);

      this.analyticsService.collect({ type: 'event', category: 'delete', action: 'custom-header' });
    }
    this.environmentUpdated('routeCustomHeader');
  }

  /**
   * Pass remove event to alert service
   *
   * @param alertId
   */
  public removeAlert(alertId: string) {
    this.alertService.removeAlert(alertId);
  }

  public testCustomHeader(key: string) {
    return this.serverService.testCustomHeader(key);
  }

  public isValidURL(URL: string) {
    return this.serverService.isValidURL(URL);
  }

  public openFeedbackLink() {
    shell.openExternal(Config.feedbackLink);

    this.analyticsService.collect({ type: 'event', category: 'link', action: 'feedback' });
  }

  public openJSONWikiLink() {
    shell.openExternal(Config.wikiJSONLink);

    this.analyticsService.collect({ type: 'event', category: 'link', action: 'wiki' });
  }

  public applyUpdate() {
    this.updateService.applyUpdate();

    this.analyticsService.collect({ type: 'event', category: 'link', action: 'apply-update' });
  }

  /**
   * Set editor mode depending on content type
   */
  private changeEditorSettings() {
    const contentType = this.serverService.getCustomHeader(this.currentRoute.route, 'Content-Type');

    if (contentType === 'application/json') {
      this.editorConfig.mode = 'json';
    } else if (contentType === 'text/html' || contentType === 'application/xhtml+xml') {
      this.editorConfig.mode = 'html';
    } else if (contentType === 'application/xml') {
      this.editorConfig.mode = 'xml';
    } else if (contentType === 'text/css') {
      this.editorConfig.mode = 'css';
    } else {
      this.editorConfig.mode = 'text';
    }
  }

  /**
   * Show and position the context menu
   *
   * @param event - click event
   */
  public navigationContextMenu(subject: 'environment' | 'route', subjectId: number, event: any) {
    // if right click display context menu
    if (event && event.which === 3) {
      const menu: ContextMenuEventType = {
        event: event,
        items: [
          {
            payload: {
              subject,
              action: 'delete',
              subjectId
            },
            label: 'Delete ' + subject,
            icon: 'delete',
            confirm: {
              icon: 'error',
              label: 'Confirm deletion'
            },
            confirmColor: 'text-danger'
          },
          {
            payload: {
              subject,
              action: 'duplicate',
              subjectId
            },
            label: 'Duplicate ' + subject,
            icon: 'content_copy'
          }
        ]
      };

      if (subject === 'environment') {
        menu.items.push({
          payload: {
            subject,
            action: 'env_settings',
            subjectId
          },
          label: 'Environment settings',
          icon: 'settings'
        });
      }
      this.eventsService.contextMenuEvents.emit(menu);
    }
  }

  /**
   * Handle navigation context menu item click
   *
   * @param payload
   */
  public navigationContextMenuItemClicked(payload: ContextMenuItemPayload) {
    if (payload.action === 'delete') {
      if (payload.subject === 'route') {
        this.removeRoute(payload.subjectId);
      } else if (payload.subject === 'environment') {
        this.removeEnvironment(payload.subjectId);
      }
    } else if (payload.action === 'duplicate') {
      if (payload.subject === 'route') {
        this.duplicateRoute(payload.subjectId);
      } else if (payload.subject === 'environment') {
        this.duplicateEnvironment(payload.subjectId);
      }
    } else if (payload.action === 'env_settings' && payload.subject === 'environment') {
      if (payload.subjectId !== this.currentEnvironment.index) {
        this.selectEnvironment(payload.subjectId);
      }
      this.setCurrentTab('ENV_SETTINGS');
    }
  }

  /**
   * Duplicate an environment
   */
  public duplicateEnvironment(environmentIndex: number) {
    const index = this.environmentsService.duplicateEnvironment(environmentIndex, () => {
      this.analyticsService.collect({ type: 'event', category: 'duplicate', action: 'environment' });
    });
    this.selectEnvironment(index);

    // auto scroll environments to bottom when adding
    this.environmentsMenu.nativeElement.scrollTop = this.environmentsMenu.nativeElement.scrollHeight;
  }

  /**
   * Duplicate a route
   */
  public duplicateRoute(routeIndex: number) {
    const index = this.environmentsService.duplicateRoute(this.currentEnvironment.environment, routeIndex, () => {
      this.analyticsService.collect({ type: 'event', category: 'duplicate', action: 'route' });
    });
    this.selectRoute(index);

    // auto scroll routes to bottom when adding
    this.routesMenu.nativeElement.scrollTop = this.routesMenu.nativeElement.scrollHeight;
  }

  public handleSettingsModalClosed() {
    this.settingsModalOpened = false;
  }
}
