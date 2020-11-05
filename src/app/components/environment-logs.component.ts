import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { GetEditorModeFromContentType } from 'src/app/libs/utils.lib';
import { EnvironmentLog, EnvironmentLogRequest, EnvironmentLogResponse } from 'src/app/models/environment-logs.model';
import { DataService } from 'src/app/services/data.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { setActiveEnvironmentLogUUIDAction } from 'src/app/stores/actions';
import { EnvironmentLogsTabsNameType, Store } from 'src/app/stores/store';

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
  public activeEnvironmentLogUUID$: Observable<string>;
  public activeEnvironmentLog$: Observable<EnvironmentLog>;
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

  constructor(
    private store: Store,
    private environmentsService: EnvironmentsService,
    private dataService: DataService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.environmentLogs$ = this.store
      .selectActiveEnvironmentLogs()
      .pipe(distinctUntilChanged());

    this.activeEnvironmentLogUUID$ = this.environmentLogs$.pipe(
      mergeMap(() => this.store.selectActiveEnvironmentLogUUID())
    );

    this.activeEnvironmentLog$ = this.activeEnvironmentLogUUID$.pipe(
      withLatestFrom(this.environmentLogs$),
      map(([activeEnvironmentLogUUID, environmentLogs]) => environmentLogs.find(
          (environmentLog) => environmentLog.UUID === activeEnvironmentLogUUID
        )),
      map((environmentLog) => {
        if (environmentLog) {
          if (environmentLog.request.body) {
            environmentLog.request.truncatedBody = this.dataService.truncateBody(
              environmentLog.request.body
            );
          }

          if (environmentLog.response.body) {
            environmentLog.response.truncatedBody = this.dataService.truncateBody(
              environmentLog.response.body
            );
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
  public createRouteFromLog(logUUID: string) {
    this.environmentsService.createRouteFromLog(logUUID);
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
}
