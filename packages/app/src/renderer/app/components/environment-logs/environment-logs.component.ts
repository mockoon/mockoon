import {
  AsyncPipe,
  DatePipe,
  LowerCasePipe,
  NgClass,
  TitleCasePipe,
  UpperCasePipe
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GetContentType, isContentTypeApplicationJson } from '@mockoon/commons';
import { NgbCollapse, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { formatDistanceToNow } from 'date-fns';
import { Observable, of, timer } from 'rxjs';
import {
  combineLatestWith,
  distinctUntilChanged,
  filter,
  map,
  startWith
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import {
  DropdownMenuComponent,
  DropdownMenuItem
} from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { EditorComponent } from 'src/renderer/app/components/editor/editor.component';
import { FilterComponent } from 'src/renderer/app/components/filter/filter.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { ToggleComponent } from 'src/renderer/app/components/toggle/toggle.component';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { ResizeColumnDirective } from 'src/renderer/app/directives/resize-column.directive';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import {
  buildResponseLabel,
  GetEditorModeFromContentType,
  textFilter
} from 'src/renderer/app/libs/utils.lib';
import { ToggleItems } from 'src/renderer/app/models/common.model';
import {
  EnvironmentLog,
  EnvironmentLogOrigin
} from 'src/renderer/app/models/environment-logs.model';
import { EnvironmentLogsTabsNameType } from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import {
  clearLogsAction,
  setActiveEnvironmentLogUUIDAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

type CollapseStates = {
  'request.general': boolean;
  'request.headers': boolean;
  'request.routeParams': boolean;
  'request.queryParams': boolean;
  'request.body': boolean;
  'response.general': boolean;
  'response.headers': boolean;
  'response.body': boolean;
};

type logsDropdownMenuPayload = { logUuid: string };

@Component({
  selector: 'app-environment-logs',
  templateUrl: 'environment-logs.component.html',
  styleUrls: ['environment-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbTooltip,
    SvgComponent,
    FilterComponent,
    ReactiveFormsModule,
    NgClass,
    DropdownMenuComponent,
    ResizeColumnDirective,
    NgbCollapse,
    EditorComponent,
    AsyncPipe,
    UpperCasePipe,
    LowerCasePipe,
    TitleCasePipe,
    DatePipe,
    ToggleComponent
  ]
})
export class EnvironmentLogsComponent implements OnInit {
  private store = inject(Store);
  private environmentsService = inject(EnvironmentsService);
  private eventsService = inject(EventsService);
  private uiService = inject(UIService);
  private datePipe = inject(DatePipe);

  public environmentLogs$: Observable<
    (EnvironmentLog & { timeHuman$: Observable<string> })[]
  >;
  public activeEnvironmentLogsTab$: Observable<EnvironmentLogsTabsNameType>;
  public activeEnvironmentUUID$: Observable<string>;
  public activeEnvironmentLog$: Observable<
    EnvironmentLog & {
      routeResponseLabel?: string;
    }
  >;
  public environmentLogsCount$: Observable<number>;
  public settings$: Observable<Settings>;
  public logsOrigin = new FormControl<'all' | EnvironmentLogOrigin>('all');
  public collapseStates: CollapseStates = {
    'request.general': false,
    'request.headers': false,
    'request.routeParams': false,
    'request.queryParams': false,
    'request.body': false,
    'response.general': false,
    'response.headers': false,
    'response.body': false
  };
  public menuSize = Config.defaultSecondaryMenuSize;
  public clearEnvironmentLogsRequested$ = new TimedBoolean();
  public logsRecording$ = this.eventsService.logsRecording$;
  public editorConfigs$: Observable<{
    request: typeof defaultEditorOptions;
    response: typeof defaultEditorOptions;
  }>;
  public isWeb = Config.isWeb;
  public logsFilter$: Observable<string>;
  public dateFormat = 'yyyy-MM-dd HH:mm:ss:SSS';
  public focusableInputs = FocusableInputs;
  public isEnvCloud$ = this.store.selectIsActiveEnvCloud();
  public dropdownMenuItems: DropdownMenuItem[] = [
    {
      label: 'Create mock endpoint',
      icon: 'control_point_duplicate',
      twoSteps: false,
      action: ({ logUuid }: logsDropdownMenuPayload) => {
        this.environmentsService.createRouteFromLog(
          this.store.get('activeEnvironmentUUID'),
          logUuid,
          true
        );
      }
    },
    {
      label: () =>
        this.isEnvCloud$.pipe(
          map((isCloud) =>
            isCloud ? 'Copy as cURL (localhost)' : 'Copy as cURL'
          )
        ),
      icon: 'content_copy',
      twoSteps: false,
      action: ({ logUuid }: logsDropdownMenuPayload) => {
        this.environmentsService.copyLogAsCurl(
          this.store.get('activeEnvironmentUUID'),
          logUuid,
          false
        );
      },
      hidden$: () => of(this.isWeb)
    },
    {
      label: `Copy as cURL${this.isWeb ? '' : ' (cloud)'}`,
      icon: 'content_copy',
      twoSteps: false,
      action: ({ logUuid }: logsDropdownMenuPayload) => {
        this.environmentsService.copyLogAsCurl(
          this.store.get('activeEnvironmentUUID'),
          logUuid,
          true
        );
      },
      hidden$: () => this.isEnvCloud$.pipe(map((isCloud) => !isCloud))
    }
  ];
  public logOrigins: ToggleItems = [
    {
      value: 'all',
      label: 'All'
    },
    {
      value: 'local',
      label: 'Local',
      icon: 'computer',
      iconSize: 14
    },
    {
      value: 'cloud',
      label: 'Cloud',
      icon: 'cloud',
      iconSize: 14
    }
  ];

  ngOnInit() {
    this.logsFilter$ = this.store.selectFilter('logs');
    this.settings$ = this.store.select('settings');
    this.activeEnvironmentUUID$ = this.store.select('activeEnvironmentUUID');
    this.environmentLogsCount$ = this.store
      .selectActiveEnvironmentLogs()
      .pipe(map((logs) => logs.length));
    this.environmentLogs$ = this.store.selectActiveEnvironmentLogs().pipe(
      combineLatestWith(
        this.logsFilter$,
        this.logsOrigin.valueChanges.pipe(
          startWith(this.logsOrigin.value),
          distinctUntilChanged()
        )
      ),
      map(([environmentLogs, search, logsOrigin]) => {
        let result: EnvironmentLog[] = environmentLogs;

        if (logsOrigin !== 'all') {
          result = result.filter((log) => log.origin === logsOrigin);
        }

        if (search) {
          result = result.filter((log) =>
            textFilter(
              `${log.method} ${log.url} ${log.response.status} ${log.response.statusMessage} ${log.request.query} ${this.datePipe.transform(log.timestampMs, this.dateFormat)} ${log.proxied ? 'proxied' : ''}`,
              search
            )
          );
        }

        return result;
      }),
      map((logs) =>
        logs.map((log) => ({
          ...log,
          timeHuman$: timer(0, 10_000).pipe(
            map(() =>
              formatDistanceToNow(log.timestampMs, {
                addSuffix: true,
                includeSeconds: true
              })
            )
          )
        }))
      )
    );

    this.activeEnvironmentLog$ = this.store.selectActiveEnvironmentLog().pipe(
      distinctUntilChanged(),
      map((environmentLog) => {
        const updatedEnvironmentLog: EnvironmentLog & {
          routeResponseLabel?: string;
        } = environmentLog;

        if (environmentLog) {
          if (environmentLog.response?.body) {
            const contentEncoding = environmentLog.response.headers.find(
              (header) => header.key.toLowerCase() === 'content-encoding'
            )?.value;

            if (
              contentEncoding === 'gzip' ||
              contentEncoding === 'br' ||
              contentEncoding === 'deflate' ||
              contentEncoding === 'zstd'
            ) {
              updatedEnvironmentLog.response.decompressed = true;
            }
          }

          const route = this.store.getRouteByUUID(environmentLog.routeUUID);
          const routeResponseIndex = route?.responses.findIndex(
            (response) => response.uuid === environmentLog.routeResponseUUID
          );

          if (routeResponseIndex !== undefined && routeResponseIndex > -1) {
            updatedEnvironmentLog.routeResponseLabel = buildResponseLabel(
              route.type,
              routeResponseIndex,
              route.responses[routeResponseIndex]
            );
          }
        }

        return updatedEnvironmentLog;
      })
    );

    this.editorConfigs$ = this.activeEnvironmentLog$.pipe(
      filter((activeEnvironmentLog) => !!activeEnvironmentLog),
      map((activeEnvironmentLog) => {
        const responseContentTypeHeader = GetContentType(
          activeEnvironmentLog.response.headers
        );
        const requestContentTypeHeader = GetContentType(
          activeEnvironmentLog.request.headers
        );
        const baseEditorConfig = this.store.get('bodyEditorConfig');

        const responseEditorMode = responseContentTypeHeader
          ? GetEditorModeFromContentType(responseContentTypeHeader)
          : 'text';

        const requestEditorMode = requestContentTypeHeader
          ? GetEditorModeFromContentType(requestContentTypeHeader)
          : 'text';

        return {
          request: {
            ...baseEditorConfig,
            options: {
              ...baseEditorConfig.options,
              // enable JSON validation
              useWorker: isContentTypeApplicationJson(
                activeEnvironmentLog.request.headers
              )
                ? true
                : false
            },
            mode: requestEditorMode
          },
          response: {
            ...baseEditorConfig,
            options: {
              ...baseEditorConfig.options,
              // enable JSON validation
              useWorker: isContentTypeApplicationJson(
                activeEnvironmentLog.response.headers
              )
                ? true
                : false
            },
            mode: responseEditorMode
          }
        };
      })
    );

    this.activeEnvironmentLogsTab$ = this.store.select(
      'activeEnvironmentLogsTab'
    );
  }

  /**
   * Select environment logs details at specified index
   *
   * @param logIndex
   */
  public selectLog(environmentLogUUID: string) {
    this.store.update(
      setActiveEnvironmentLogUUIDAction(
        this.store.get('activeEnvironmentUUID'),
        environmentLogUUID
      )
    );
  }

  /**
   * Set the environment logs active tab
   */
  public setActiveTab(tabName: EnvironmentLogsTabsNameType) {
    this.environmentsService.setActiveEnvironmentLogTab(tabName);
  }

  /**
   * Clear logs for active environment
   */
  public clearEnvironmentLogs() {
    if (this.clearEnvironmentLogsRequested$.readValue().enabled) {
      this.store.update(
        clearLogsAction(this.store.get('activeEnvironmentUUID'))
      );
    }
  }

  /**
   * Start recording entering requests/responses
   */
  public startRecording(environmentUuid: string) {
    this.environmentsService.startRecording(environmentUuid);
  }

  /**
   * Stop recording entering requests/responses
   */
  public stopRecording(environmentUuid: string) {
    this.environmentsService.stopRecording(environmentUuid);
  }

  public openSettings() {
    this.uiService.openModal('settings');
  }

  public goToRouteResponse(log: EnvironmentLog) {
    this.environmentsService.navigateToRouteResponse(
      log.routeUUID,
      log.routeResponseUUID
    );
  }
}
