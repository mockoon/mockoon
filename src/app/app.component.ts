import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  CORSHeaders,
  Environment,
  Environments,
  GetRouteResponseContentType,
  Header,
  IsValidURL,
  MimeTypesWithTemplating,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ipcRenderer, remote, shell } from 'electron';
import { lookup as mimeTypeLookup } from 'mime-types';
import { DragulaService } from 'ng2-dragula';
import { merge, Observable, Subject, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  tap
} from 'rxjs/operators';
import { Logger } from 'src/app/classes/logger';
import { TimedBoolean } from 'src/app/classes/timed-boolean';
import { ChangelogModalComponent } from 'src/app/components/changelog-modal.component';
import { SettingsModalComponent } from 'src/app/components/settings-modal.component';
import { Config } from 'src/app/config';
import { INDENT_SIZE } from 'src/app/constants/common.constants';
import { methods, statusCodes } from 'src/app/constants/routes.constants';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { FocusableInputs } from 'src/app/enums/ui.enum';
import { HeadersProperties } from 'src/app/models/common.model';
import { ContextMenuItemPayload } from 'src/app/models/context-menu.model';
import { DataSubject } from 'src/app/models/data.model';
import {
  EnvironmentLog,
  EnvironmentLogs
} from 'src/app/models/environment-logs.model';
import { Toast } from 'src/app/models/toasts.model';
import { DraggableContainerNames } from 'src/app/models/ui.model';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { ImportExportService } from 'src/app/services/import-export.service';
import { IpcService } from 'src/app/services/ipc.service';
import { StorageService } from 'src/app/services/storage.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { UIService } from 'src/app/services/ui.service';
import {
  clearLogsAction,
  updateRouteAction,
  updateUIStateAction
} from 'src/app/stores/actions';
import { ReducerDirectionType } from 'src/app/stores/reducer';
import {
  DuplicatedRoutesTypes,
  EnvironmentsStatuses,
  EnvironmentStatus,
  Store,
  TabsNameType,
  ViewsNameType
} from 'src/app/stores/store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('changelogModal', { static: false })
  public changelogModal: ChangelogModalComponent;
  @ViewChild('settingsModal', { static: false })
  public settingsModal: SettingsModalComponent;
  public activeEnvironment$: Observable<Environment>;
  public activeEnvironmentForm: FormGroup;
  public activeEnvironmentState$: Observable<EnvironmentStatus>;
  public activeRoute$: Observable<Route>;
  public activeRouteForm: FormGroup;
  public activeRouteResponse$: Observable<RouteResponse>;
  public activeRouteResponseForm: FormGroup;
  public activeRouteResponseIndex$: Observable<number>;
  public activeRouteResponseLastLog$: Observable<EnvironmentLog>;
  public injectedHeaders$: Observable<Header[]>;
  public activeTab$: Observable<TabsNameType>;
  public activeView$: Observable<ViewsNameType>;
  public bodyEditorConfig$: Observable<any>;
  public clearEnvironmentLogsRequested$ = new TimedBoolean(false, 4000);
  public deleteCurrentRouteResponseRequested$ = new TimedBoolean(false, 4000);
  public duplicatedEnvironments$: Observable<Set<string>>;
  public duplicatedRoutes$: Observable<DuplicatedRoutesTypes>;
  public environments$: Observable<Environments>;
  public environmentsLogs$: Observable<EnvironmentLogs>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public Infinity = Infinity;
  public isValidURL = IsValidURL;
  public methods = methods;
  public scrollToBottom = this.uiService.scrollToBottom;
  public statusCodes = statusCodes;
  public toasts$: Observable<Toast[]>;
  public focusableInputs = FocusableInputs;
  private injectHeaders$ = new Subject<Header[]>();
  private BrowserWindow = remote.BrowserWindow;
  private dialog = remote.dialog;
  private logger = new Logger('[COMPONENT][APP]');
  private closingSubscription: Subscription;

  constructor(
    private analyticsService: AnalyticsService,
    private authService: AuthService,
    private config: NgbTooltipConfig,
    private dragulaService: DragulaService,
    private environmentsService: EnvironmentsService,
    private eventsService: EventsService,
    private formBuilder: FormBuilder,
    private importExportService: ImportExportService,
    private store: Store,
    private toastService: ToastsService,
    private uiService: UIService,
    private ipcService: IpcService,
    private storageService: StorageService
  ) {}

  // Listen to widow beforeunload event, and verify that no data saving is in progress
  @HostListener('window:beforeunload', ['$event'])
  public onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.storageService.isSaving()) {
      if (!this.closingSubscription) {
        this.logger.info('App closing. Waiting for save to finish.');

        this.store.update(updateUIStateAction({ appClosing: true }));

        this.closingSubscription = this.storageService
          .saving()
          .pipe(
            filter((saving) => !saving),
            tap(() => {
              ipcRenderer.send('renderer-app-quit');
              window.onbeforeunload = null;
            })
          )
          .subscribe();
      }

      event.returnValue = '';
    }
  }

  ngOnInit() {
    this.injectedHeaders$ = this.injectHeaders$.asObservable();

    // tooltip config
    this.config.container = 'body';

    this.logger.info('Initializing application');

    this.dragulaService.dropModel().subscribe((dragResult) => {
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
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.bodyEditorConfig$ = this.store.select('bodyEditorConfig');
    this.duplicatedEnvironments$ = this.store.select('duplicatedEnvironments');
    this.duplicatedRoutes$ = this.store.select('duplicatedRoutes');
    this.environmentsLogs$ = this.store.select('environmentsLogs');
    this.activeRouteResponseLastLog$ = this.store.selectActiveRouteResponseLastLog();
    this.toasts$ = this.store.select('toasts');

    this.initFormValues();
  }

  ngAfterViewInit() {
    this.ipcService.init(this.changelogModal, this.settingsModal);
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

  public openWikiLink(linkName: string) {
    shell.openExternal(Config.docs[linkName]);
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
    const mimeType = mimeTypeLookup(filePath) || 'none';

    return {
      mimeType,
      supportsTemplating: MimeTypesWithTemplating.indexOf(mimeType) > -1
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
    this.injectHeaders$.next(CORSHeaders);
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
            JSON.stringify(
              JSON.parse(activeRouteResponse.body),
              undefined,
              INDENT_SIZE
            )
          );
      } catch (e) {
        // ignore any errors with parsing / stringifying the JSON
      }
    }
  }

  /**
   * Update the store when headers lists are updated
   */
  public headersUpdated(
    subject: 'environment' | 'routeResponse',
    targetHeaders: HeadersProperties,
    headers: Header[]
  ) {
    if (subject === 'environment') {
      this.environmentsService.updateActiveEnvironment({
        [targetHeaders]: headers
      });
    } else if (subject === 'routeResponse') {
      this.environmentsService.updateActiveRouteResponse({
        [targetHeaders]: headers
      });
    }
  }

  /**
   * Navigate to the logs with route response's log selected
   */
  public goToRouteResponseLog(lastLogUUID: string) {
    this.environmentsService.setActiveEnvironmentActiveLog(lastLogUUID);
    this.environmentsService.setActiveView('ENV_LOGS');
    this.environmentsService.setActiveEnvironmentLogTab('RESPONSE');
  }

  /**
   * Duplicate the active route response
   */
  public duplicateRouteResponse() {
    this.environmentsService.duplicateRouteResponse();
  }

  /**
   * Enable/disable random response
   */
  public toggleRandomResponse(randomResponse: boolean) {
    this.store.update(
      updateRouteAction({
        randomResponse: !randomResponse
      })
    );
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
      statusCode: [null],
      label: [''],
      latency: [''],
      filePath: [''],
      sendFileAsBody: [''],
      body: [''],
      rules: this.formBuilder.array([]),
      disableTemplating: [false]
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(
      ...Object.keys(this.activeEnvironmentForm.controls).map((controlName) =>
        this.activeEnvironmentForm
          .get(controlName)
          .valueChanges.pipe(map((newValue) => ({ [controlName]: newValue })))
      )
    ).subscribe((newProperty) => {
      this.environmentsService.updateActiveEnvironment(newProperty);
    });

    // send new activeRouteForm values to the store, one by one
    merge(
      ...Object.keys(this.activeRouteForm.controls).map((controlName) =>
        this.activeRouteForm
          .get(controlName)
          .valueChanges.pipe(map((newValue) => ({ [controlName]: newValue })))
      )
    ).subscribe((newProperty) => {
      this.environmentsService.updateActiveRoute(newProperty);
    });

    // send new activeRouteResponseForm values to the store, one by one
    merge(
      ...Object.keys(this.activeRouteResponseForm.controls).map((controlName) =>
        this.activeRouteResponseForm
          .get(controlName)
          .valueChanges.pipe(map((newValue) => ({ [controlName]: newValue })))
      )
    ).subscribe((newProperty) => {
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
        filter((environment) => !!environment),
        distinctUntilKeyChanged('uuid')
      )
      .subscribe((activeEnvironment) => {
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
        filter((route) => !!route),
        distinctUntilKeyChanged('uuid')
      )
      .subscribe((activeRoute) => {
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
        filter((routeResponse) => !!routeResponse),
        // monitor changes in uuid and body (for body formatter method)
        distinctUntilChanged(
          (previous, next) =>
            previous.uuid === next.uuid && previous.body === next.body
        )
      )
      .subscribe((activeRouteResponse) => {
        this.activeRouteResponseForm.patchValue(
          {
            statusCode: activeRouteResponse.statusCode,
            label: activeRouteResponse.label,
            latency: activeRouteResponse.latency,
            filePath: activeRouteResponse.filePath,
            sendFileAsBody: activeRouteResponse.sendFileAsBody,
            body: activeRouteResponse.body,
            rules: activeRouteResponse.rules,
            disableTemplating: activeRouteResponse.disableTemplating
          },
          { emitEvent: false }
        );
      });
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
   * Enable/disable a route
   */
  private toggleRoute(routeUUID?: string) {
    this.environmentsService.toggleRoute(routeUUID);
  }
}
