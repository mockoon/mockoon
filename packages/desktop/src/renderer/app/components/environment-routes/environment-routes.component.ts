import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  Environment,
  FileExtensionsWithTemplating,
  GetContentType,
  GetRouteResponseContentType,
  Header,
  INDENT_SIZE,
  Methods,
  MimeTypesWithTemplating,
  ParsedJSONBodyMimeTypes,
  ReorderAction,
  ReorderableContainers,
  ResponseMode,
  Route,
  RouteDefault,
  RouteResponse,
  RouteResponseDefault,
  RouteType,
  RulesDisablingResponseModes,
  RulesNotUsingDefaultResponse,
  StreamingMode,
  stringIncludesArrayItems
} from '@mockoon/commons';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, combineLatest, from, merge } from 'rxjs';
import {
  combineLatestWith,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  startWith,
  takeUntil,
  tap
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { DropdownMenuItem } from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { statusCodeValidation } from 'src/renderer/app/constants/masks.constants';
import {
  StatusCodes,
  defaultContentType
} from 'src/renderer/app/constants/routes.constants';
import { Texts } from 'src/renderer/app/constants/texts.constant';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { buildFullPath, textFilter } from 'src/renderer/app/libs/utils.lib';
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
import { Store } from 'src/renderer/app/stores/store';

type fileDropdownMenuPayload = { filePath: string; environmentUuid: string };

@Component({
  selector: 'app-environment-routes',
  templateUrl: './environment-routes.component.html',
  styleUrls: ['./environment-routes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class EnvironmentRoutesComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public activeRoute$: Observable<Route>;
  public activeRouteResponse$: Observable<RouteResponse>;
  public activeRouteResponses$: Observable<
    (RouteResponse & { originalIndex: number })[]
  >;
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
  public activeRouteForm: UntypedFormGroup;
  public activeRouteResponseForm: UntypedFormGroup;
  public scrollToBottom = this.uiService.scrollToBottom;
  public databuckets$: Observable<DropdownItems>;
  public externalLink$: Observable<string>;
  public methods: DropdownItems = [
    {
      value: Methods.all,
      label: 'All methods',
      classes: 'color-method-all'
    },
    {
      value: Methods.get,
      label: 'GET',
      classes: 'color-method-get'
    },
    {
      value: Methods.post,
      label: 'POST',
      classes: 'color-method-post'
    },
    {
      value: Methods.put,
      label: 'PUT',
      classes: 'color-method-put'
    },
    {
      value: Methods.patch,
      label: 'PATCH',
      classes: 'color-method-patch'
    },
    {
      value: Methods.delete,
      label: 'DELETE',
      classes: 'color-method-delete'
    },
    {
      value: Methods.head,
      label: 'HEAD',
      classes: 'color-method-head'
    },
    {
      value: Methods.options,
      label: 'OPTIONS',
      classes: 'color-method-options'
    },
    {
      value: Methods.propfind,
      label: 'PROPFIND',
      classes: 'color-method-propfind'
    },
    {
      value: Methods.proppatch,
      label: 'PROPPATCH',
      classes: 'color-method-proppatch'
    },
    {
      value: Methods.move,
      label: 'MOVE',
      classes: 'color-method-move'
    },
    {
      value: Methods.copy,
      label: 'COPY',
      classes: 'color-method-copy'
    },
    {
      value: Methods.mkcol,
      label: 'MKCOL',
      classes: 'color-method-mkcol'
    },
    {
      value: Methods.lock,
      label: 'LOCK',
      classes: 'color-method-lock'
    },
    {
      value: Methods.unlock,
      label: 'UNLOCK',
      classes: 'color-method-unlock'
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
    },
    {
      value: ResponseMode.FALLBACK,
      icon: 'low_priority',
      tooltip:
        'Fallback response mode (does not return the default response if none of the rules match, will jump to the next route or use the proxy if configured)'
    }
  ];
  // disables fallback mode for websockets.
  public responseModesForWs: ToggleItems = this.responseModes.filter(
    (m) => m.value !== ResponseMode.FALLBACK
  );
  public streamingModes: ToggleItems = [
    {
      value: StreamingMode.UNICAST,
      icon: 'events',
      tooltip: 'One-to-one streaming'
    },
    {
      value: StreamingMode.BROADCAST,
      icon: 'broadcast',
      tooltip: 'Broadcast streaming'
    }
  ];
  public bodyType: ToggleItems = [
    {
      value: 'INLINE',
      label: 'Inline'
    },
    {
      value: 'FILE',
      label: 'File'
    },
    {
      value: 'DATABUCKET',
      label: 'Data'
    }
  ];
  public window = window;
  public rulesDisablingResponseModes: ResponseMode[] =
    RulesDisablingResponseModes;
  public rulesNotUsingDefaultResponse: ResponseMode[] =
    RulesNotUsingDefaultResponse;
  public statusCodes = StatusCodes;
  public statusCodeValidation = statusCodeValidation;
  public focusableInputs = FocusableInputs;
  public Infinity = Infinity;
  public texts = Texts;
  public fileDropdownMenuItems: DropdownMenuItem[] = [
    {
      label: 'Browse',
      icon: 'find_in_page',
      twoSteps: false,
      action: () => {
        this.dialogsService
          .showOpenDialog('Choose a file', null, false)
          .pipe(
            tap((filePaths) => {
              if (filePaths?.[0]) {
                this.activeRouteResponseForm
                  .get('filePath')
                  .setValue(filePaths[0]);
              }
            })
          )
          .subscribe();
      }
    },
    {
      label: 'Show file in explorer/finder',
      icon: 'folder',
      twoSteps: false,
      action: ({ environmentUuid, filePath }: fileDropdownMenuPayload) => {
        const environmentPath = this.store.getEnvironmentPath(environmentUuid);

        MainAPI.send('APP_SHOW_FILE', filePath, environmentPath);
      }
    },
    {
      label: 'Open file in editor',
      icon: 'file_open',
      twoSteps: false,
      action: ({ environmentUuid, filePath }: fileDropdownMenuPayload) => {
        const environmentPath = this.store.getEnvironmentPath(environmentUuid);

        MainAPI.send('APP_OPEN_FILE', filePath, environmentPath);
      }
    }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private store: Store,
    private formBuilder: UntypedFormBuilder,
    private dialogsService: DialogsService,
    private environmentsService: EnvironmentsService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store
      .selectActiveEnvironment()
      .pipe(distinctUntilChanged());
    this.activeRoute$ = this.store.selectActiveRoute();
    this.activeRouteResponses$ = this.activeRoute$.pipe(
      filter((activeRoute) => !!activeRoute),
      distinctUntilChanged(),
      combineLatestWith(this.store.selectFilter('routeResponses')),
      map(([activeRoute, search]) => ({
        routeType: activeRoute.type,
        responses: activeRoute.responses.map((response, originalIndex) => ({
          ...response,
          originalIndex
        })),
        search
      })),
      map(({ routeType, responses, search }) =>
        !search
          ? responses
          : responses.filter((response, responseIndex) =>
              textFilter(
                `${routeType === RouteType.CRUD && response.default ? 'CRUD operations' : ''} ${routeType === RouteType.CRUD ? responseIndex : responseIndex + 1} ${response.statusCode} ${response.label}`,
                search
              )
            )
      )
    );
    this.activeRouteResponse$ = this.store.selectActiveRouteResponse();
    this.activeRouteResponseIndex$ =
      this.store.selectActiveRouteResponseIndex();
    this.activeRouteResponseLastLog$ =
      this.store.selectActiveRouteResponseLastLog();
    this.activeResponseFileMimeType$ = this.activeRouteResponse$.pipe(
      filter((activeRouteResponse) => !!activeRouteResponse),
      map((activeRouteResponse) => activeRouteResponse?.filePath),
      filter((filePath) => !!filePath),
      distinctUntilChanged(),
      mergeMap((filePath) =>
        from(MainAPI.invoke('APP_GET_MIME_TYPE', filePath)).pipe(
          map((mimeType) => ({
            mimeType,
            filePath
          }))
        )
      ),
      map(({ mimeType, filePath }) => ({
        mimeType,
        supportsTemplating:
          MimeTypesWithTemplating.includes(mimeType) ||
          FileExtensionsWithTemplating.includes(`.${filePath.split('.').pop()}`)
      }))
    );
    this.databuckets$ = this.activeEnvironment$.pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      map((activeEnvironment) =>
        activeEnvironment.data.map((data) => ({
          value: data.id,
          label: `${data.name}${
            data.documentation ? ' - ' + data.documentation : ''
          }`
        }))
      )
    );
    this.externalLink$ = combineLatest([
      this.activeEnvironment$,
      this.activeRoute$
    ]).pipe(
      map(([activeEnvironment, activeRoute]) =>
        buildFullPath(activeEnvironment, activeRoute)
      )
    );

    /**
     * Effective content type:
     *
     * if file and no route header --> file mime type
     * if file and route header --> route content type
     * if no file and route header --> route content type
     * if no file and no route header --> env content type
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
          contentTypeInfo.fileMimeType &&
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
   * @param reorderAction
   */
  public reorderRouteResponses(reorderAction: ReorderAction) {
    this.environmentsService.reorderItems(
      reorderAction as ReorderAction<string>,
      ReorderableContainers.ROUTE_RESPONSES
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

    if (stringIncludesArrayItems(ParsedJSONBodyMimeTypes, contentType)) {
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
      } catch (_error) {
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
    routeResponseUuid: string | null,
    event: MouseEvent
  ) {
    // prevent dropdown item selection
    event.stopPropagation();

    if (routeResponseUuid != null) {
      this.environmentsService.setDefaultRouteResponse(routeResponseUuid);
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
      responseMode: [RouteDefault.responseMode],
      streamingMode: [RouteDefault.streamingMode],
      streamingInterval: [RouteDefault.streamingInterval]
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
      bodyType: [RouteResponseDefault.bodyType],
      filePath: [RouteResponseDefault.filePath],
      databucketID: [RouteResponseDefault.databucketID],
      sendFileAsBody: [RouteResponseDefault.sendFileAsBody],
      body: [RouteResponseDefault.body],
      rules: this.formBuilder.array([]),
      disableTemplating: [RouteResponseDefault.disableTemplating],
      fallbackTo404: [RouteResponseDefault.fallbackTo404],
      crudKey: [RouteResponseDefault.crudKey]
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
   * Listen to store to init form values
   * Init only when the UUID changes or when the action is forcing an update
   */
  private initFormValues() {
    // subscribe to active route changes to reset the form
    this.activeRoute$
      .pipe(
        filter((route) => !!route),
        this.store.distinctUUIDOrForce(),
        takeUntil(this.destroy$)
      )
      .subscribe((activeRoute) => {
        this.activeRouteForm.patchValue(
          {
            documentation: activeRoute.documentation,
            method: activeRoute.method,
            endpoint: activeRoute.endpoint,
            responseMode: activeRoute.responseMode,
            streamingMode: activeRoute.streamingMode,
            streamingInterval: activeRoute.streamingInterval
          },
          { emitEvent: false }
        );
      });
    // subscribe to active route response changes to reset the form
    this.activeRouteResponse$
      .pipe(
        filter((routeResponse) => !!routeResponse),
        this.store.distinctUUIDOrForce(),
        takeUntil(this.destroy$)
      )
      .subscribe((activeRouteResponse) => {
        this.activeRouteResponseForm.patchValue(
          {
            statusCode: activeRouteResponse.statusCode,
            label: activeRouteResponse.label,
            latency: activeRouteResponse.latency,
            bodyType: activeRouteResponse.bodyType,
            filePath: activeRouteResponse.filePath,
            databucketID: activeRouteResponse.databucketID,
            sendFileAsBody: activeRouteResponse.sendFileAsBody,
            body: activeRouteResponse.body,
            rules: activeRouteResponse.rules,
            disableTemplating: activeRouteResponse.disableTemplating,
            fallbackTo404: activeRouteResponse.fallbackTo404,
            crudKey: activeRouteResponse.crudKey
          },
          { emitEvent: false }
        );
      });
  }
}
