import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import 'brace';
import 'brace/ext/searchbox';
import 'brace/index';
import 'brace/mode/css';
import 'brace/mode/html.js';
import 'brace/mode/json.js';
import 'brace/mode/text.js';
import 'brace/mode/xml.js';
import { ipcRenderer, remote, shell } from 'electron';
import * as mimeTypes from 'mime-types';
import { DragulaService } from 'ng2-dragula';
import { merge, Observable } from 'rxjs';
import { distinctUntilChanged, distinctUntilKeyChanged, filter, map } from 'rxjs/operators';
import { TimedBoolean } from 'src/app/classes/timed-boolean';
import { ContextMenuItemPayload } from 'src/app/components/context-menu.component';
import { Config } from 'src/app/config';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { GetRouteResponseContentType } from 'src/app/libs/utils.lib';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ContextMenuEvent, EventsService } from 'src/app/services/events.service';
import { ServerService } from 'src/app/services/server.service';
import { Toast, ToastsService } from 'src/app/services/toasts.service';
import { UpdateService } from 'src/app/services/update.service';
import { clearLogsAction } from 'src/app/stores/actions.js';
import { ReducerDirectionType } from 'src/app/stores/reducer';
import { DuplicatedRoutesTypes, EnvironmentsStatuses, EnvironmentStatus, Store, TabsNameType, ViewsNameType } from 'src/app/stores/store';
import { DataSubjectType } from 'src/app/types/data.type';
import { Environment, Environments } from 'src/app/types/environment.type';
import { methods, mimeTypesWithTemplating, Route, RouteResponse, statusCodes } from 'src/app/types/route.type';
import { EnvironmentLogs } from 'src/app/types/server.type.js';
import { dragulaNamespaces as DraggableContainerNames, Scroll } from 'src/app/types/ui.type.js';
import '../assets/custom_theme.js';
const platform = require('os').platform();
const appVersion = require('../../package.json').version;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  @ViewChild('routesMenu', { static: false }) private routesMenu: ElementRef;
  @ViewChild('environmentsMenu', { static: false }) private environmentsMenu: ElementRef;
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
    private dragulaService: DragulaService,
    private analyticsService: AnalyticsService,
    private store: Store,
    private formBuilder: FormBuilder
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
          this.addRoute();
          break;
        case 'START_ENVIRONMENT':
          this.toggleEnvironment();
          break;
        case 'DUPLICATE_ENVIRONMENT':
          this.duplicateEnvironment();
          break;
        case 'DUPLICATE_ROUTE':
          this.duplicateRoute();
          break;
        case 'DELETE_ENVIRONMENT':
          this.removeEnvironment();
          break;
        case 'DELETE_ROUTE':
          this.removeRoute();
          break;
        case 'PREVIOUS_ENVIRONMENT':
          this.selectEnvironment('previous');
          break;
        case 'NEXT_ENVIRONMENT':
          this.selectEnvironment('next');
          break;
        case 'PREVIOUS_ROUTE':
          this.selectRoute('previous');
          break;
        case 'NEXT_ROUTE':
          this.selectRoute('next');
          break;
        case 'OPEN_SETTINGS':
          if (!this.settingsModalOpened) {
            this.settingsModalOpened = true;
            this.eventsService.settingsModalEvents.emit(true);
          }
          break;
        case 'IMPORT_FILE':
          this.environmentsService.importEnvironmentsFile();
          break;
        case 'IMPORT_CLIPBOARD':
          this.environmentsService.importFromClipboard();
          break;
        case 'EXPORT_FILE':
          this.environmentsService.exportAllEnvironments();
          break;
      }
    });
  }

  ngOnInit() {
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

    this.initDragMonitoring();
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
      latency: [''],
      filePath: [''],
      sendFileAsBody: [''],
      body: [''],
      rules: this.formBuilder.array([])
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(...Object.keys(this.activeEnvironmentForm.controls).map(controlName => {
      return this.activeEnvironmentForm.get(controlName).valueChanges.pipe(
        map(newValue => ({ [controlName]: newValue }))
      );
    })).subscribe(newProperty => {
      this.environmentsService.updateActiveEnvironment(newProperty);
    });

    // send new activeRouteForm values to the store, one by one
    merge(...Object.keys(this.activeRouteForm.controls).map(controlName => {
      return this.activeRouteForm.get(controlName).valueChanges.pipe(
        map(newValue => ({ [controlName]: newValue }))
      );
    })).subscribe(newProperty => {
      this.environmentsService.updateActiveRoute(newProperty);
    });

    // send new activeRouteResponseForm values to the store, one by one
    merge(...Object.keys(this.activeRouteResponseForm.controls).map(controlName => {
      return this.activeRouteResponseForm.get(controlName).valueChanges.pipe(
        map(newValue => ({ [controlName]: newValue }))
      );
    })).subscribe(newProperty => {
      this.environmentsService.updateActiveRouteResponse(newProperty);
    });
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active environment changes to reset the form
    this.activeEnvironment$.pipe(
      filter(environment => !!environment),
      distinctUntilKeyChanged('uuid')
    ).subscribe(activeEnvironment => {
      this.activeEnvironmentForm.setValue({
        name: activeEnvironment.name,
        port: activeEnvironment.port,
        endpointPrefix: activeEnvironment.endpointPrefix,
        latency: activeEnvironment.latency,
        proxyMode: activeEnvironment.proxyMode,
        proxyHost: activeEnvironment.proxyHost,
        https: activeEnvironment.https,
        cors: activeEnvironment.cors
      }, { emitEvent: false });
    });

    // subscribe to active route changes to reset the form
    this.activeRoute$.pipe(
      filter(route => !!route),
      distinctUntilKeyChanged('uuid')
    ).subscribe(activeRoute => {
      this.activeRouteForm.patchValue({
        documentation: activeRoute.documentation,
        method: activeRoute.method,
        endpoint: activeRoute.endpoint
      }, { emitEvent: false });
    });

    // subscribe to active route response changes to reset the form
    this.activeRouteResponse$.pipe(
      filter(routeResponse => !!routeResponse),
      // monitor changes in uuid and body (for body formatter method)
      distinctUntilChanged((previous, next) => previous.uuid === next.uuid && previous.body === next.body)
    ).subscribe(activeRouteResponse => {
      this.activeRouteResponseForm.patchValue({
        statusCode: activeRouteResponse.statusCode,
        latency: activeRouteResponse.latency,
        filePath: activeRouteResponse.filePath,
        sendFileAsBody: activeRouteResponse.sendFileAsBody,
        body: activeRouteResponse.body,
        rules: activeRouteResponse.rules
      }, { emitEvent: false });
    });
  }

  /**
   * Trigger env/route saving and re-selection when draging active route/env
   */
  public initDragMonitoring() {
    this.dragulaService.dropModel().subscribe((dragResult) => {
      this.environmentsService.moveMenuItem(dragResult.name as DraggableContainerNames, dragResult.sourceIndex, dragResult.targetIndex);
    });
  }

  /**
   * Toggle active environment running state (start/stop)
   */
  public toggleEnvironment() {
    this.environmentsService.toggleActiveEnvironment();
  }

  /**
   * Listen for and do requested scrolling
   */
  public scrollTo({element, action, position}: Scroll) {
    if (this[element] && this[element].nativeElement) {
      this[element].nativeElement[action] = position;
    }
  }

  /**
   * Set the active environment
   */
  public selectEnvironment(environmentUUIDOrDirection: string | ReducerDirectionType) {
    this.environmentsService.setActiveEnvironment(environmentUUIDOrDirection);

    // auto scroll routes to top when navigating environments
    this.scrollTo({element: 'routesMenu', action: 'scrollTop', position: 0});
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
      this.store.update(clearLogsAction(this.store.get('activeEnvironmentUUID')));
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
   * Select a route by UUID, or the first route if no UUID is present
   */
  public selectRoute(routeUUIDOrDirection: string | ReducerDirectionType) {
    this.environmentsService.setActiveRoute(routeUUIDOrDirection);
  }

  /**
   * Create a new environment. Append at the end of the list.
   */
  public addEnvironment() {
    this.environmentsService.addEnvironment();

    this.scrollToBottom(this.environmentsMenu.nativeElement);
  }

  /**
   * Duplicate an environment
   */
  public duplicateEnvironment(environmentUUID?: string) {
    this.environmentsService.duplicateEnvironment(environmentUUID);

    this.scrollToBottom(this.environmentsMenu.nativeElement);
  }

  /**
   * Create a new route in the current environment. Append at the end of the list
   */
  public addRoute() {
    this.environmentsService.addRoute();

    if (this.routesMenu) {
      this.scrollToBottom(this.routesMenu.nativeElement);
    }
  }

  /**
   * Create a new route response in the current route. Append at the end of the list
   */
  public addRouteResponse() {
    this.environmentsService.addRouteResponse();
  }

  /**
   * Duplicate a route
   */
  public duplicateRoute(routeUUID?: string) {
    this.environmentsService.duplicateRoute(routeUUID);

    this.scrollToBottom(this.routesMenu.nativeElement);
  }

  public handleSettingsModalClosed() {
    this.settingsModalOpened = false;
  }

  /**
   * Remove route and navigate depending on remaining routes
   */
  private removeRoute(routeUUID?: string) {
    this.environmentsService.removeRoute(routeUUID);
  }

  /**
   * Remove environment and navigate depending on remaining environments
   */
  private removeEnvironment(environmentUUID?: string) {
    this.environmentsService.removeEnvironment(environmentUUID);
  }

  /**
   * Open GET routes in the browser
   */
  public openRouteInBrowser() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();

    let routeUrl = ((activeEnvironment.https) ? 'https://' : 'http://') + 'localhost:' + activeEnvironment.port + '/';

    if (activeEnvironment.endpointPrefix) {
      routeUrl += activeEnvironment.endpointPrefix + '/';
    }

    routeUrl += activeRoute.endpoint;

    shell.openExternal(routeUrl);

    this.eventsService.analyticsEvents.next(AnalyticsEvents.LINK_ROUTE_IN_BROWSER);
  }

  /**
   * Open file browsing dialog
   */
  public async browseFiles() {
    const dialogResult = await this.dialog.showOpenDialog(this.BrowserWindow.getFocusedWindow(), {});

    if (dialogResult.filePaths && dialogResult.filePaths[0]) {
      this.activeRouteResponseForm.get('filePath').setValue(dialogResult.filePaths[0]);
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
   * Show and position the context menu
   *
   * @param event - click event
   */
  public navigationContextMenu(subject: DataSubjectType, subjectUUID: string, event: any) {
    // if right click display context menu
    if (event && event.which === 3) {
      const menu: ContextMenuEvent = {
        event: event,
        items: [
          {
            payload: {
              subject,
              action: 'duplicate',
              subjectUUID
            },
            label: 'Duplicate ' + subject,
            icon: 'content_copy'
          },
          {
            payload: {
              subject,
              action: 'export',
              subjectUUID
            },
            label: 'Copy to clipboard (JSON)',
            icon: 'assignment'
          },
          {
            payload: {
              subject,
              action: 'delete',
              subjectUUID
            },
            label: 'Delete ' + subject,
            icon: 'delete',
            confirm: {
              icon: 'error',
              label: 'Confirm deletion'
            },
            confirmColor: 'text-danger'
          }
        ]
      };

      if (subject === 'environment') {
        menu.items.unshift(
          {
            payload: {
              subject,
              action: 'env_logs',
              subjectUUID
            },
            label: 'Environment logs',
            icon: 'history'
          },
          {
            payload: {
              subject,
              action: 'env_settings',
              subjectUUID
            },
            label: 'Environment settings',
            icon: 'settings',
            separator: true
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
          this.duplicateRoute(payload.subjectUUID);
        } else if (payload.subject === 'environment') {
          this.duplicateEnvironment(payload.subjectUUID);
        }
        break;
      case 'export':
        this.exportToClipboard(payload.subject, payload.subjectUUID);
        break;
      case 'delete':
        if (payload.subject === 'route') {
          this.removeRoute(payload.subjectUUID);
        } else if (payload.subject === 'environment') {
          this.removeEnvironment(payload.subjectUUID);
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
  public exportToClipboard(subject: DataSubjectType, subjectUUID: string) {
    if (subject === 'environment') {
      this.environmentsService.exportEnvironmentToClipboard(subjectUUID);
    } else if (subject === 'route') {
      this.environmentsService.exportRouteToClipboard(subjectUUID);
    }
  }

  /**
   * Get file mime type and check if supports templating
   */
  public getFileMimeType(filePath: string): { mimeType: string, supportsTemplating: boolean } {
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
      const queryStringMatch = endpoint.match(/\?.*=/ig);

      return queryStringMatch && queryStringMatch.length > 0;
    }

    return false;
  }

  /**
   * Scroll to bottom of an element
   *
   * @param element
   */
  public scrollToBottom(element: Element) {
    setTimeout(() => {
      element.scrollTop = element.scrollHeight;
    });
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
    const routeResponseContentType = GetRouteResponseContentType(activeEnvironment, activeRouteResponse);

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

    const contentType = GetRouteResponseContentType(this.store.getActiveEnvironment(), activeRouteResponse);

    if (contentType === 'application/json') {
      try {
        this.activeRouteResponseForm.get('body').setValue(JSON.stringify(JSON.parse(activeRouteResponse.body), undefined, 2));
      } catch (e) {
        // ignore any errors with parsing / stringifying the JSON
      }
    }
  }
}
