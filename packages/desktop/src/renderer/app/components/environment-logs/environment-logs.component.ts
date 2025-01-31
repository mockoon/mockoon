import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GetContentType, isContentTypeApplicationJson } from '@mockoon/commons';
import { formatDistanceToNow } from 'date-fns';
import { Observable, timer } from 'rxjs';
import {
  combineLatestWith,
  distinctUntilChanged,
  filter,
  map
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { DropdownMenuItem } from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import {
  GetEditorModeFromContentType,
  textFilter
} from 'src/renderer/app/libs/utils.lib';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
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
  standalone: false
})
export class EnvironmentLogsComponent implements OnInit {
  public environmentLogs$: Observable<
    (EnvironmentLog & { timeHuman$: Observable<string> })[]
  >;
  public activeEnvironmentLogsTab$: Observable<EnvironmentLogsTabsNameType>;
  public activeEnvironmentUUID$: Observable<string>;
  public activeEnvironmentLog$: Observable<EnvironmentLog>;
  public environmentLogsCount$: Observable<number>;
  public settings$: Observable<Settings>;
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
  public logsFilter$: Observable<string>;
  public dateFormat = 'yyyy-MM-dd HH:mm:ss:SSS';
  public focusableInputs = FocusableInputs;
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
    }
  ];

  constructor(
    private store: Store,
    private environmentsService: EnvironmentsService,
    private eventsService: EventsService,
    private uiService: UIService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.logsFilter$ = this.store.selectFilter('logs');
    this.settings$ = this.store.select('settings');
    this.activeEnvironmentUUID$ = this.store.select('activeEnvironmentUUID');
    this.environmentLogsCount$ = this.store
      .selectActiveEnvironmentLogs()
      .pipe(map((logs) => logs.length));
    this.environmentLogs$ = this.store.selectActiveEnvironmentLogs().pipe(
      combineLatestWith(this.logsFilter$),
      map(([environmentLogs, search]) =>
        !search
          ? environmentLogs
          : environmentLogs.filter((log) =>
              textFilter(
                `${log.method} ${log.url} ${log.response.status} ${log.response.statusMessage} ${log.request.query} ${this.datePipe.transform(log.timestampMs, this.dateFormat)} ${log.proxied ? 'proxied' : ''}`,
                search
              )
            )
      ),
      map((logs) =>
        logs.map((log) => ({
          ...log,
          timeHuman$: timer(0, 60_000).pipe(
            map(() => formatDistanceToNow(log.timestampMs, { addSuffix: true }))
          )
        }))
      )
    );

    this.activeEnvironmentLog$ = this.store.selectActiveEnvironmentLog().pipe(
      distinctUntilChanged(),
      map((environmentLog) => {
        if (environmentLog) {
          if (environmentLog.response?.body) {
            const contentEncoding = environmentLog.response.headers.find(
              (header) => header.key.toLowerCase() === 'content-encoding'
            )?.value;

            if (
              contentEncoding === 'gzip' ||
              contentEncoding === 'br' ||
              contentEncoding === 'deflate'
            ) {
              environmentLog.response.unzipped = true;
            }
          }
        }

        return environmentLog;
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
}
