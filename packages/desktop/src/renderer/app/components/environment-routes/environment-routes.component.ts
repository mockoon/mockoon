import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  Environment,
  GetContentType,
  GetRouteResponseContentType,
  Header,
  INDENT_SIZE,
  Methods,
  MimeTypesWithTemplating,
  ResponseMode,
  Route,
  RouteDefault,
  RouteResponse,
  RouteResponseDefault
} from '@mockoon/commons';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest, from, merge, Observable, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  mergeMap,
  pluck,
  startWith,
  takeUntil,
  tap
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { StatusCodeValidation } from 'src/renderer/app/constants/masks.constants';
import {
  defaultContentType,
  StatusCodes
} from 'src/renderer/app/constants/routes.constants';
import { Texts } from 'src/renderer/app/constants/texts.constant';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { BuildFullPath } from 'src/renderer/app/libs/utils.lib';
import {
  DropdownItems,
  ToggleItems
} from 'src/renderer/app/models/common.model';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
import {
  EnvironmentsStatuses,
  TabsNameType
} from 'src/renderer/app/models/store.model';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { setDefaultRouteResponseAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';

@Component({
  selector: 'app-environment-routes',
  templateUrl: './environment-routes.component.html',
  styleUrls: ['./environment-routes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentRoutesComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public activeRoute$: Observable<Route>;
  public activeRouteResponse$: Observable<RouteResponse>;
  public activeRouteResponseIndex$: Observable<number>;
  public activeRouteResponseLastLog$: Observable<EnvironmentLog>;
  public activeResponseFileMimeType$: Observable<{
    mimeType: string;
    supportsTemplating: boolean;
  }>;
  public effectiveContentType$: Observable<string>;
  public defaultResponseTooltip$: Observable<string>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public activeTab$: Observable<TabsNameType>;
  public deleteCurrentRouteResponseRequested$ = new TimedBoolean();
  public bodyEditorConfig$: Observable<any>;
  public activeRouteForm: FormGroup;
  public activeRouteResponseForm: FormGroup;
  public scrollToBottom = this.uiService.scrollToBottom;
  public methods: DropdownItems = [
    {
      value: Methods.get,
      label: 'GET',
      classes: 'http-method-get-text'
    },
    {
      value: Methods.post,
      label: 'POST',
      classes: 'http-method-post-text'
    },
    {
      value: Methods.put,
      label: 'PUT',
      classes: 'http-method-put-text'
    },
    {
      value: Methods.patch,
      label: 'PATCH',
      classes: 'http-method-patch-text'
    },
    {
      value: Methods.delete,
      label: 'DELETE',
      classes: 'http-method-delete-text'
    },
    {
      value: Methods.head,
      label: 'HEAD',
      classes: 'http-method-head-text'
    },
    {
      value: Methods.options,
      label: 'OPTIONS',
      classes: 'http-method-options-text'
    }
  ];
  public responseModes: ToggleItems = [
    {
      value: ResponseMode.RANDOM,
      icon: 'shuffle',
      tooltip: 'Random response mode (will disable the rules)'
    },
    {
      value: ResponseMode.SEQUENTIAL,
      icon: 'repeat',
      tooltip: 'Sequential response mode (will disable the rules)'
    },
    {
      value: ResponseMode.DISABLE_RULES,
      icon: 'rule',
      tooltip: 'Disabled rules mode (default response only)',
      activeClass: 'text-warning'
    }
  ];
  public statusCodes = StatusCodes;
  public statusCodeValidation = StatusCodeValidation;
  public focusableInputs = FocusableInputs;
  public Infinity = Infinity;
  public texts = Texts;
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private store: Store,
    private formBuilder: FormBuilder,
    private dialogsService: DialogsService,
    private environmentsService: EnvironmentsService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeRoute$ = this.store.selectActiveRoute();
    this.activeRouteResponse$ = this.store.selectActiveRouteResponse();
    this.activeRouteResponseIndex$ =
      this.store.selectActiveRouteResponseIndex();
    this.activeRouteResponseLastLog$ =
      this.store.selectActiveRouteResponseLastLog();
    this.activeResponseFileMimeType$ = this.activeRouteResponse$.pipe(
      pluck('filePath'),
      filter((filePath) => !!filePath),
      distinctUntilChanged(),
      mergeMap((filePath) =>
        from(MainAPI.invoke('APP_GET_MIME_TYPE', filePath))
      ),
      map((mimeType) => ({
        mimeType,
        supportsTemplating: MimeTypesWithTemplating.indexOf(mimeType) > -1
      }))
    );

    /**
     * Effective content type:
     *
     * if file and no route header --> file mime type OK
     * if file and route header --> route header OK
     * if no file and route header --> route header OK
     * if no file and no route header --> env header
     * default?
     */
    this.effectiveContentType$ = combineLatest([
      this.activeEnvironment$.pipe(
        filter((activeEnvironment) => !!activeEnvironment)
      ),
      this.activeRouteResponse$.pipe(
        filter((activeRouteResponse) => !!activeRouteResponse)
      ),
      this.activeResponseFileMimeType$.pipe(startWith({ mimeType: null }))
    ]).pipe(
      map(([activeEnvironment, activeRouteResponse, fileMimeType]) => ({
        environmentContentType: GetContentType(activeEnvironment.headers),
        routeResponseContentType: GetContentType(activeRouteResponse.headers),
        fileMimeType: fileMimeType.mimeType,
        hasFile: !!activeRouteResponse.filePath
      })),
      map((contentTypeInfo) => {
        if (contentTypeInfo.routeResponseContentType) {
          return contentTypeInfo.routeResponseContentType;
        }

        if (
          contentTypeInfo.hasFile &&
          !contentTypeInfo.routeResponseContentType
        ) {
          return contentTypeInfo.fileMimeType;
        }

        if (contentTypeInfo.environmentContentType) {
          return contentTypeInfo.environmentContentType;
        }

        return defaultContentType;
      })
    );

    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.activeTab$ = this.store.select('activeTab');
    this.bodyEditorConfig$ = this.store.select('bodyEditorConfig');

    this.initForms();
    this.initFormValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /**
   * Create a new route response in the current route. Append at the end of the list
   */
  public addRouteResponse() {
    this.environmentsService.addRouteResponse();
  }

  /**
   * Callback called when reordering route responses
   *
   * @param event
   */
  public reorderRouteResponses(event: CdkDragDrop<string[]>) {
    this.environmentsService.moveMenuItem(
      'routeResponses',
      event.previousIndex,
      event.currentIndex
    );
  }

  /**
   * Delete currently selected route response
   */
  public deleteCurrentRouteResponse() {
    if (this.deleteCurrentRouteResponseRequested$.readValue().enabled) {
      this.environmentsService.removeRouteResponse();
    }
  }

  /**
   * Update the store when route headers list is updated
   */
  public routeHeadersUpdated(headers: Header[]) {
    this.environmentsService.updateActiveRouteResponse({
      headers
    });
  }

  /**
   * Set the application active tab
   */
  public setActiveTab(tabName: TabsNameType) {
    this.environmentsService.setActiveTab(tabName);
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
   * Set the application active route response
   */
  public setActiveRouteResponse(
    routeResponseUUID: string,
    routeResponsesDropdown: NgbDropdown
  ) {
    routeResponsesDropdown.close();
    this.environmentsService.setActiveRouteResponse(routeResponseUUID);
  }

  /**
   * Open GET routes in the browser
   */
  public openRouteInBrowser() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeRoute = this.store.getActiveRoute();

    MainAPI.send(
      'APP_OPEN_EXTERNAL_LINK',
      BuildFullPath(activeEnvironment, activeRoute)
    );
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
   * Open file browsing dialog
   */
  public browseFiles() {
    /* WIP */
    this.dialogsService
      .showOpenDialog('Choose a file', null, false)
      .pipe(
        tap((filePath) => {
          if (filePath) {
            this.activeRouteResponseForm.get('filePath').setValue(filePath);
          }
        })
      )
      .subscribe();
  }

  public openWikiLink(linkName: string) {
    MainAPI.send('APP_OPEN_EXTERNAL_LINK', Config.docs[linkName]);
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
   * Set a route response as default
   *
   * @param routeResponseIndex
   * @param event
   */
  public setDefaultRouteResponse(
    routeResponseIndex: number | null,
    event: MouseEvent
  ) {
    /* event.preventDefault();
    event.stopImmediatePropagation(); */
    // prevent dropdown item selection
    event.stopPropagation();

    if (routeResponseIndex != null) {
      this.store.update(setDefaultRouteResponseAction(routeResponseIndex));
    }
  }

  /**
   * Init forms and subscribe to changes
   */
  private initForms() {
    this.activeRouteForm = this.formBuilder.group({
      documentation: [RouteDefault.documentation],
      method: [RouteDefault.method],
      endpoint: [RouteDefault.endpoint],
      responseMode: [RouteDefault.responseMode]
    });

    this.defaultResponseTooltip$ = this.activeRouteForm
      .get('responseMode')
      .valueChanges.pipe(
        startWith(RouteDefault.responseMode),
        map((responseMode: ResponseMode) => {
          if (
            responseMode === ResponseMode.SEQUENTIAL ||
            responseMode === ResponseMode.RANDOM
          ) {
            return 'Default response disabled by random or sequential responses';
          } else if (responseMode === ResponseMode.DISABLE_RULES) {
            return 'Default response always served as rules are disabled';
          }

          return 'Default response served if no rule matches';
        })
      );

    // send new activeRouteForm values to the store, one by one
    merge(
      ...Object.keys(this.activeRouteForm.controls).map((controlName) =>
        this.activeRouteForm
          .get(controlName)
          .valueChanges.pipe(map((newValue) => ({ [controlName]: newValue })))
      )
    )
      .pipe(
        tap((newProperty) => {
          this.environmentsService.updateActiveRoute(newProperty);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.activeRouteResponseForm = this.formBuilder.group({
      statusCode: [RouteResponseDefault.statusCode],
      label: [RouteResponseDefault.label],
      latency: [RouteResponseDefault.latency],
      filePath: [RouteResponseDefault.filePath],
      sendFileAsBody: [RouteResponseDefault.sendFileAsBody],
      body: [RouteResponseDefault.body],
      rules: this.formBuilder.array([]),
      disableTemplating: [RouteResponseDefault.disableTemplating],
      fallbackTo404: [RouteResponseDefault.fallbackTo404]
    });

    // send new activeRouteResponseForm values to the store, one by one
    merge(
      ...Object.keys(this.activeRouteResponseForm.controls).map((controlName) =>
        this.activeRouteResponseForm
          .get(controlName)
          .valueChanges.pipe(map((newValue) => ({ [controlName]: newValue })))
      )
    )
      .pipe(
        tap((newProperty) => {
          this.environmentsService.updateActiveRouteResponse(newProperty);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active route changes to reset the form
    this.activeRoute$
      .pipe(
        filter((route) => !!route),
        distinctUntilKeyChanged('uuid'),
        takeUntil(this.destroy$)
      )
      .subscribe((activeRoute) => {
        this.activeRouteForm.patchValue(
          {
            documentation: activeRoute.documentation,
            method: activeRoute.method,
            endpoint: activeRoute.endpoint,
            responseMode: activeRoute.responseMode
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
        ),
        takeUntil(this.destroy$)
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
            disableTemplating: activeRouteResponse.disableTemplating,
            fallbackTo404: activeRouteResponse.fallbackTo404
          },
          { emitEvent: false }
        );
      });
  }
}
