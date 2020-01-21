import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ipcRenderer, remote, shell } from 'electron';
import * as mimeTypes from 'mime-types';
import { DragulaService } from 'ng2-dragula';
import { merge, Observable } from 'rxjs';
import { distinctUntilChanged, distinctUntilKeyChanged, filter, map } from 'rxjs/operators';
import { TimedBoolean } from 'src/app/classes/timed-boolean';
import { ContextMenuItemPayload } from 'src/app/components/context-menu/context-menu.component';
import { Config } from 'src/app/config';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { GetRouteResponseContentType } from 'src/app/libs/utils.lib';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { ImportExportService } from 'src/app/services/import-export.service';
import { ServerService } from 'src/app/services/server.service';
import { Toast, ToastsService } from 'src/app/services/toasts.service';
import { UIService } from 'src/app/services/ui.service';
import { UpdateService } from 'src/app/services/update.service';
import { clearLogsAction } from 'src/app/stores/actions';
import { ReducerDirectionType } from 'src/app/stores/reducer';
import { DuplicatedRoutesTypes, EnvironmentsStatuses, EnvironmentStatus, Store, TabsNameType, ViewsNameType } from 'src/app/stores/store';
import { DataSubject } from 'src/app/types/data.type';
import { Environment, Environments } from 'src/app/types/environment.type';
import { methods, mimeTypesWithTemplating, Route, RouteResponse, statusCodes } from 'src/app/types/route.type';
import { EnvironmentLogs } from 'src/app/types/server.type';
import { DraggableContainerNames, ScrollDirection } from 'src/app/types/ui.type';

const platform = require('os').platform();
const appVersion = require('../../package.json').version;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  public methods = methods;
  public statusCodes = statusCodes;
  public updateAvailable = false;
  public platform = platform;
  public hasEnvironmentHeaders = this.environmentsService.hasEnvironmentHeaders;
  public clearEnvironmentLogsRequested$ = new TimedBoolean(false, 4000);
  public deleteCurrentRouteResponseRequested$ = new TimedBoolean(false, 4000);
  public appVersion = appVersion;
  public environments$: Observable<Environments>;
  public activeEnvironment$: Observable<Environment>;
  public activeEnvironmentUUID$: Observable<string>;
  public activeRoute$: Observable<Route>;
  public activeRouteResponse$: Observable<RouteResponse>;
  public activeRouteResponseIndex$: Observable<number>;
  public activeView$: Observable<ViewsNameType>;
  public activeTab$: Observable<TabsNameType>;
  public activeEnvironmentState$: Observable<EnvironmentStatus>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedEnvironments$: Observable<Set<string>>;
  public duplicatedRoutes$: Observable<DuplicatedRoutesTypes>;
  public bodyEditorConfig$: Observable<any>;
  public environmentsLogs$: Observable<EnvironmentLogs>;
  public toasts$: Observable<Toast[]>;
  public activeEnvironmentForm: FormGroup;
  public activeRouteForm: FormGroup;
  public activeRouteResponseForm: FormGroup;
  public Infinity = Infinity;
  public scrollToBottom = this.uiService.scrollToBottom;
  private settingsModalOpened = false;
  private dialog = remote.dialog;
  private BrowserWindow = remote.BrowserWindow;

  constructor(
    private environmentsService: EnvironmentsService,
    private serverService: ServerService,
    private toastService: ToastsService,
    private updateService: UpdateService,
    private authService: AuthService,
    private eventsService: EventsService,
    private config: NgbTooltipConfig,
    private analyticsService: AnalyticsService,
    private store: Store,
    private formBuilder: FormBuilder,
    private importExportService: ImportExportService,
    private uiService: UIService,
    private dragulaService: DragulaService
  ) {
    // tooltip config
    this.config.container = 'body';

    // set listeners on main process messages
    ipcRenderer.on('keydown', (event, data) => {
      switch (data.action) {
        case 'NEW_ENVIRONMENT':
          this.addEnvironment();
          break;
        case 'NEW_ROUTE':
          this.environmentsService.addRoute();
          break;
        case 'START_ENVIRONMENT':
          this.toggleEnvironment();
          break;
        case 'DUPLICATE_ENVIRONMENT':
          this.environmentsService.duplicateEnvironment();
          break;
        case 'DUPLICATE_ROUTE':
          this.environmentsService.duplicateRoute();
          break;
        case 'DELETE_ENVIRONMENT':
          this.environmentsService.removeEnvironment();
          break;
        case 'DELETE_ROUTE':
          this.environmentsService.removeRoute();
          break;
        case 'PREVIOUS_ENVIRONMENT':
          this.selectEnvironment('previous');
          break;
        case 'NEXT_ENVIRONMENT':
          this.selectEnvironment('next');
          break;
        case 'PREVIOUS_ROUTE':
          this.environmentsService.setActiveRoute('previous');
          break;
        case 'NEXT_ROUTE':
          this.environmentsService.setActiveRoute('next');
          break;
        case 'OPEN_SETTINGS':
          if (!this.settingsModalOpened) {
            this.settingsModalOpened = true;
            this.eventsService.settingsModalEvents.emit(true);
          }
          break;
        case 'IMPORT_FILE':
          this.importExportService.importFromFile();
          break;
        case 'IMPORT_CLIPBOARD':
          this.importExportService.importFromClipboard();
          break;
        case 'EXPORT_FILE':
          this.importExportService.exportAllEnvironments();
          break;
      }
    });
  }

  ngOnInit() {
    this.dragulaService.dropModel().subscribe(dragResult => {
      this.environmentsService.moveMenuItem(
        dragResult.name as DraggableContainerNames,
        dragResult.sourceIndex,
        dragResult.targetIndex
      );
    });
    this.initForms();

    // auth anonymously through firebase
    this.authService.auth();

    this.analyticsService.init();

    this.eventsService.analyticsEvents.next(AnalyticsEvents.PAGEVIEW);
    this.eventsService.analyticsEvents.next(AnalyticsEvents.APPLICATION_START);

    this.environments$ = this.store.select('environments');
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeRoute$ = this.store.selectActiveRoute();
    this.activeRouteResponse$ = this.store.selectActiveRouteResponse();
    this.activeRouteResponseIndex$ = this.store.selectActiveRouteResponseIndex();
    this.activeTab$ = this.store.select('activeTab');
    this.activeView$ = this.store.select('activeView');
    this.activeEnvironmentState$ = this.store.selectActiveEnvironmentStatus();
    this.activeEnvironmentUUID$ = this.store.select('activeEnvironmentUUID');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.bodyEditorConfig$ = this.store.select('bodyEditorConfig');
    this.duplicatedEnvironments$ = this.store.select('duplicatedEnvironments');
    this.duplicatedRoutes$ = this.store.select('duplicatedRoutes');
    this.environmentsLogs$ = this.store.select('environmentsLogs');
    this.toasts$ = this.store.select('toasts');

    this.initFormValues();

    // subscribe to update events
    this.updateService.updateAvailable.subscribe(() => {
      this.updateAvailable = true;
    });
  }

  /**
   * Init active environment and route forms, and subscribe to changes
   */
  private initForms() {
    this.activeEnvironmentForm = this.formBuilder.group({
      name: [''],
      port: [''],
      endpointPrefix: [''],
      latency: [''],
      proxyMode: [''],
      proxyHost: [''],
      https: [''],
      cors: ['']
    });

    this.activeRouteForm = this.formBuilder.group({
      documentation: [''],
      method: [''],
      endpoint: ['']
    });

    this.activeRouteResponseForm = this.formBuilder.group({
      statusCode: [''],
      label: [''],
      latency: [''],
      filePath: [''],
      sendFileAsBody: [''],
      body: [''],
      rules: this.formBuilder.array([])
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(
      ...Object.keys(this.activeEnvironmentForm.controls).map(controlName => {
        return this.activeEnvironmentForm
          .get(controlName)
          .valueChanges.pipe(map(newValue => ({ [controlName]: newValue })));
      })
    ).subscribe(newProperty => {
      this.environmentsService.updateActiveEnvironment(newProperty);
    });

    // send new activeRouteForm values to the store, one by one
    merge(
      ...Object.keys(this.activeRouteForm.controls).map(controlName => {
        return this.activeRouteForm
          .get(controlName)
          .valueChanges.pipe(map(newValue => ({ [controlName]: newValue })));
      })
    ).subscribe(newProperty => {
      this.environmentsService.updateActiveRoute(newProperty);
    });

    // send new activeRouteResponseForm values to the store, one by one
    merge(
      ...Object.keys(this.activeRouteResponseForm.controls).map(controlName => {
        return this.activeRouteResponseForm
          .get(controlName)
          .valueChanges.pipe(map(newValue => ({ [controlName]: newValue })));
      })
    ).subscribe(newProperty => {
      this.environmentsService.updateActiveRouteResponse(newProperty);
    });
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active environment changes to reset the form
    this.activeEnvironment$
      .pipe(
        filter(environment => !!environment),
        distinctUntilKeyChanged('uuid')
      )
      .subscribe(activeEnvironment => {
        this.activeEnvironmentForm.setValue(
          {
            name: activeEnvironment.name,
            port: activeEnvironment.port,
            endpointPrefix: activeEnvironment.endpointPrefix,
            latency: activeEnvironment.latency,
            proxyMode: activeEnvironment.proxyMode,
            proxyHost: activeEnvironment.proxyHost,
            https: activeEnvironment.https,
            cors: activeEnvironment.cors
          },
          { emitEvent: false }
        );
      });

    // subscribe to active route changes to reset the form
    this.activeRoute$
      .pipe(
        filter(route => !!route),
        distinctUntilKeyChanged('uuid')
      )
      .subscribe(activeRoute => {
        this.activeRouteForm.patchValue(
          {
            documentation: activeRoute.documentation,
            method: activeRoute.method,
            endpoint: activeRoute.endpoint
          },
          { emitEvent: false }
        );
      });

    // subscribe to active route response changes to reset the form
    this.activeRouteResponse$
      .pipe(
        filter(routeResponse => !!routeResponse),
        // monitor changes in uuid and body (for body formatter method)
        distinctUntilChanged(
          (previous, next) =>
            previous.uuid === next.uuid && previous.body === next.body
        )
      )
      .subscribe(activeRouteResponse => {
        this.activeRouteResponseForm.patchValue(
          {
            statusCode: activeRouteResponse.statusCode,
            label: activeRouteResponse.label,
            latency: activeRouteResponse.latency,
            filePath: activeRouteResponse.filePath,
            sendFileAsBody: activeRouteResponse.sendFileAsBody,
            body: activeRouteResponse.body,
            rules: activeRouteResponse.rules
          },
          { emitEvent: false }
        );
      });
  }

  /**
   * Toggle active environment running state (start/stop)
   */
  public toggleEnvironment() {
    this.environmentsService.toggleActiveEnvironment();
  }

  /**
   * Set the application active tab
   */
  public setActiveTab(tabName: TabsNameType) {
    this.environmentsService.setActiveTab(tabName);
  }

  /**
   * Set the application active view
   */
  public setActiveView(viewName: ViewsNameType) {
    this.environmentsService.setActiveView(viewName);
  }

  /**
   * Set the application active route response
   */
  public setActiveRouteResponse(routeResponseUUID: string) {
    this.environmentsService.setActiveRouteResponse(routeResponseUUID);
  }

  /**
   * Clear logs for active environment
   */
  public clearEnvironmentLogs() {
    if (this.clearEnvironmentLogsRequested$.readValue()) {
      this.store.update(
        clearLogsAction(this.store.get('activeEnvironmentUUID'))
      );
    }
  }

  /**
   * Delete currently selected route response
   */
  public deleteCurrentRouteResponse() {
    if (this.deleteCurrentRouteResponseRequested$.readValue()) {
      this.environmentsService.removeRouteResponse();
    }
  }

  /**
   * Create a new route response in the current route. Append at the end of the list
   */
  public addRouteResponse() {
    this.environmentsService.addRouteResponse();
  }

  public handleSettingsModalClosed() {
    this.settingsModalOpened = false;
  }

  /**
   * Set the active environment
   */
  private selectEnvironment(
    environmentUUIDOrDirection: string | ReducerDirectionType
  ) {
    this.environmentsService.setActiveEnvironment(environmentUUIDOrDirection);
  }

  /**
   * Create a new environment. Append at the end of the list.
   */
  private addEnvironment() {
    this.environmentsService.addEnvironment();
    this.uiService.scrollEnvironmentsMenu.next(ScrollDirection.BOTTOM);
  }

  /**
   * Enable/disable a route
   */
  private toggleRoute(routeUUID?: string) {
    this.environmentsService.toggleRoute(routeUUID);
  }

  /**
   * Open GET routes in the browser
   */
  public openRouteInBrowser() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();

    let routeUrl =
      (activeEnvironment.https ? 'https://' : 'http://') +
      'localhost:' +
      activeEnvironment.port +
      '/';

    if (activeEnvironment.endpointPrefix) {
      routeUrl += activeEnvironment.endpointPrefix + '/';
    }

    routeUrl += activeRoute.endpoint;

    shell.openExternal(routeUrl);

    this.eventsService.analyticsEvents.next(
      AnalyticsEvents.LINK_ROUTE_IN_BROWSER
    );
  }

  /**
   * Open file browsing dialog
   */
  public async browseFiles() {
    const dialogResult = await this.dialog.showOpenDialog(
      this.BrowserWindow.getFocusedWindow(),
      { title: 'Choose a file' }
    );

    if (dialogResult.filePaths && dialogResult.filePaths[0]) {
      this.activeRouteResponseForm
        .get('filePath')
        .setValue(dialogResult.filePaths[0]);
    }
  }

  /**
   * Pass remove event to toast service
   */
  public removeToast(toastUUID: string) {
    this.toastService.removeToast(toastUUID);
  }

  public isValidURL(URL: string) {
    return this.serverService.isValidURL(URL);
  }

  public openFeedbackLink() {
    shell.openExternal(Config.feedbackLink);

    this.eventsService.analyticsEvents.next(AnalyticsEvents.LINK_FEEDBACK);
  }

  public openChangelogModal() {
    this.eventsService.changelogModalEvents.next(true);

    this.eventsService.analyticsEvents.next(AnalyticsEvents.LINK_RELEASE);
  }

  public openWikiLink(linkName: string) {
    shell.openExternal(Config.wikiLinks[linkName]);

    this.eventsService.analyticsEvents.next(AnalyticsEvents.LINK_WIKI);
  }

  public applyUpdate() {
    this.updateService.applyUpdate();

    this.eventsService.analyticsEvents.next(AnalyticsEvents.LINK_APPLY_UPDATE);
  }

  /**
   * Handle navigation context menu item click
   *
   * @param payload
   */
  public contextMenuItemClicked(payload: ContextMenuItemPayload) {
    switch (payload.action) {
      case 'env_logs':
        if (payload.subjectUUID !== this.store.get('activeEnvironmentUUID')) {
          this.selectEnvironment(payload.subjectUUID);
        }
        this.setActiveView('ENV_LOGS');
        break;
      case 'env_settings':
        if (payload.subjectUUID !== this.store.get('activeEnvironmentUUID')) {
          this.selectEnvironment(payload.subjectUUID);
        }
        this.setActiveView('ENV_SETTINGS');
        break;
      case 'duplicate':
        if (payload.subject === 'route') {
          this.environmentsService.duplicateRoute(payload.subjectUUID);
        } else if (payload.subject === 'environment') {
          this.environmentsService.duplicateEnvironment(payload.subjectUUID);
        }
        break;
      case 'export':
        this.exportToClipboard(payload.subject, payload.subjectUUID);
        break;
      case 'delete':
        if (payload.subject === 'route') {
          this.environmentsService.removeRoute(payload.subjectUUID);
        } else if (payload.subject === 'environment') {
          this.environmentsService.removeEnvironment(payload.subjectUUID);
        }
        break;
      case 'toggle':
        if (payload.subject === 'route') {
          this.toggleRoute(payload.subjectUUID);
        }
        break;
    }
  }

  /**
   * Export an environment to the clipboard
   *
   * @param subject
   * @param subjectUUID
   */
  public exportToClipboard(subject: DataSubject, subjectUUID: string) {
    if (subject === 'environment') {
      this.importExportService.exportEnvironmentToClipboard(subjectUUID);
    } else if (subject === 'route') {
      this.importExportService.exportRouteToClipboard(subjectUUID);
    }
  }

  /**
   * Get file mime type and check if supports templating
   */
  public getFileMimeType(
    filePath: string
  ): { mimeType: string; supportsTemplating: boolean } {
    const mimeType = mimeTypes.lookup(filePath);

    return {
      mimeType,
      supportsTemplating: mimeTypesWithTemplating.indexOf(mimeType) > -1
    };
  }

  /**
   * Check if route has query params
   */
  public routeHasQueryParams(): boolean {
    const endpoint = this.store.getActiveRoute().endpoint;

    if (endpoint) {
      const queryStringMatch = endpoint.match(/\?.*=/gi);

      return queryStringMatch && queryStringMatch.length > 0;
    }

    return false;
  }

  /**
   * Add the CORS predefined headers to the environment headers
   */
  public addCORSHeadersToEnvironment() {
    this.environmentsService.setEnvironmentCORSHeaders();
  }

  /**
   * Get the route content type or the parent environment content type
   */
  public getRouteResponseContentType() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRouteResponse = this.store.getActiveRouteResponse();
    const routeResponseContentType = GetRouteResponseContentType(
      activeEnvironment,
      activeRouteResponse
    );

    if (routeResponseContentType) {
      return 'Content-Type ' + routeResponseContentType;
    }

    return 'No Content-Type is set';
  }

  /**
   * If the body is set and the Content-Type is application/json, then prettify the JSON.
   */
  public formatBody() {
    const activeRouteResponse = this.store.getActiveRouteResponse();

    if (!activeRouteResponse.body) {
      return;
    }

    const contentType = GetRouteResponseContentType(
      this.store.getActiveEnvironment(),
      activeRouteResponse
    );

    if (contentType.includes('application/json')) {
      try {
        this.activeRouteResponseForm
          .get('body')
          .setValue(
            JSON.stringify(JSON.parse(activeRouteResponse.body), undefined, 2)
          );
      } catch (e) {
        // ignore any errors with parsing / stringifying the JSON
      }
    }
  }
}
