import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { GetEditorModeFromContentType } from 'src/renderer/app/libs/utils.lib';
import {
  EnvironmentLog,
  EnvironmentLogRequest,
  EnvironmentLogResponse
} from 'src/renderer/app/models/environment-logs.model';
import { EnvironmentLogsTabsNameType } from 'src/renderer/app/models/store.model';
import { DataService } from 'src/renderer/app/services/data.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
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

@Component({
  selector: 'app-environment-logs',
  templateUrl: 'environment-logs.component.html',
  styleUrls: ['environment-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentLogsComponent implements OnInit {
  public environmentLogs$: Observable<EnvironmentLog[]>;
  public activeEnvironmentLogsTab$: Observable<EnvironmentLogsTabsNameType>;
  public activeEnvironmentUUID$: Observable<string>;
  public activeEnvironmentLogUUID$: Observable<string>;
  public activeEnvironmentLog$: Observable<EnvironmentLog>;
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

  constructor(
    private store: Store,
    private environmentsService: EnvironmentsService,
    private dataService: DataService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.settings$ = this.store.select('settings');
    this.activeEnvironmentUUID$ = this.store.select('activeEnvironmentUUID');
    this.environmentLogs$ = this.store.selectActiveEnvironmentLogs();

    this.activeEnvironmentLogUUID$ = this.environmentLogs$.pipe(
      mergeMap(() => this.store.selectActiveEnvironmentLogUUID())
    );

    this.activeEnvironmentLog$ = this.activeEnvironmentLogUUID$.pipe(
      withLatestFrom(this.environmentLogs$),
      map(([activeEnvironmentLogUUID, environmentLogs]) =>
        environmentLogs.find(
          (environmentLog) => environmentLog.UUID === activeEnvironmentLogUUID
        )
      ),
      map((environmentLog) => {
        if (environmentLog) {
          if (environmentLog.request.body) {
            environmentLog.request.truncatedBody =
              this.dataService.truncateBody(environmentLog.request.body);
          }

          if (environmentLog.response.body) {
            environmentLog.response.truncatedBody =
              this.dataService.truncateBody(environmentLog.response.body);

            const contentEncoding = environmentLog.response.headers.find(
              (header) => header.key.toLowerCase() === 'content-encoding'
            )?.value;

            if (
              contentEncoding === 'gzip' ||
              contentEncoding === 'br' ||
              contentEncoding === 'deflate'
            ) {
              environmentLog.response.bodyState = 'unzipped';
            } else {
              environmentLog.response.bodyState = 'raw';
            }
          }
        }

        return environmentLog;
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
   * Call the environment service to create a route from the logs
   *
   * @param logUUID
   */
  public createRouteFromLog(environmentUUID: string, logUUID: string) {
    this.environmentsService.createRouteFromLog(environmentUUID, logUUID, true);
  }

  /**
   * Open editor modal to view the body
   */
  public viewBodyInEditor(
    logResponseOrRequest: EnvironmentLogResponse | EnvironmentLogRequest,
    location: 'request' | 'response'
  ) {
    const contentTypeHeader = logResponseOrRequest.headers.find(
      (header) => header.key.toLowerCase() === 'content-type'
    );
    const editorMode =
      contentTypeHeader && contentTypeHeader.value
        ? GetEditorModeFromContentType(contentTypeHeader.value)
        : 'text';

    this.eventsService.editorModalEvents.emit({
      content: logResponseOrRequest.body,
      mode: editorMode,
      title: `${location} body`
    });
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
  public startRecording(environmentUUID: string) {
    this.eventsService.logsRecording$.next({
      ...this.eventsService.logsRecording$.value,
      [environmentUUID]: true
    });

    const environmentsStatus = this.store.get('environmentsStatus');
    const activeEnvironmentStatus = environmentsStatus[environmentUUID];

    if (!activeEnvironmentStatus.running) {
      this.environmentsService.toggleEnvironment(environmentUUID);
    }
  }

  /**
   * Stop recording entering requests/responses
   */
  public stopRecording(environmentUUID: string) {
    this.eventsService.logsRecording$.next({
      ...this.eventsService.logsRecording$.value,
      [environmentUUID]: false
    });
  }
}
