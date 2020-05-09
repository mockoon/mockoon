import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EnvironmentLog } from 'src/app/models/environment-logs.model';
import { EnvironmentsService } from 'src/app/services/environments.service';
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
  public selectedLogIndex$ = new BehaviorSubject<number>(0);
  public collapseStates: CollapseStates;

  constructor(
    private store: Store,
    private environmentsService: EnvironmentsService
  ) {}

  ngOnInit() {
    this.environmentLogs$ = this.store.selectActiveEnvironmentLogs().pipe(
      tap(() => {
        this.resetCollapseStates();
        this.selectLog(0);
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
  public selectLog(logIndex: number) {
    this.selectedLogIndex$.next(logIndex);
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
   * @param logUuid
   */
  public createRouteFromLog(logUuid: string) {
    this.environmentsService.createRouteFromLog(logUuid);
  }

  private resetCollapseStates() {
    this.collapseStates = {
      'request.general': false,
      'request.headers': false,
      'request.routeParams': false,
      'request.queryParams': false,
      'request.body': false,
      'response.general': false,
      'response.headers': false,
      'response.body': false
    };
  }
}
