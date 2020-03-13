import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EnvironmentLogsTabsNameType, Store } from 'src/app/stores/store';
import { EnvironmentLogs } from 'src/app/types/server.type';

@Component({
  selector: 'app-environment-logs',
  templateUrl: 'environment-logs.component.html',
  styleUrls: ['environment-logs.component.scss']
})
export class EnvironmentLogsComponent implements OnInit {
  @Input() activeEnvironmentUUID$: Observable<string>;
  @Input() environmentsLogs$: Observable<EnvironmentLogs>;
  public generalCollapsed: boolean;
  public headersCollapsed: boolean;
  public routeParamsCollapsed: boolean;
  public queryParamsCollapsed: boolean;
  public bodyCollapsed: boolean;
  public responseGeneralCollapsed: boolean;
  public responseHeadersCollapsed: boolean;
  public responseBodyCollapsed: boolean;
  public selectedLogIndex = new BehaviorSubject<number>(0);
  public selectedLogIndex$: Observable<number>;
  public activeEnvironmentLogsTab$: Observable<EnvironmentLogsTabsNameType>;

  constructor(private store: Store, private environmentsService: EnvironmentsService) { }

  ngOnInit() {
    this.selectedLogIndex$ = this.selectedLogIndex.asObservable();

    this.activeEnvironmentLogsTab$ = this.store.select('activeEnvironmentLogsTab');

    const environmentsLogs = this.store.get('environmentsLogs');
    this.activeEnvironmentUUID$.pipe(
      distinctUntilChanged()
    ).subscribe((activeEnvironmentUUID) => {
      if (environmentsLogs[activeEnvironmentUUID] && environmentsLogs[activeEnvironmentUUID].length) {
        this.showLogDetails(0);
      } else {
        this.initCollapse();
        this.selectedLogIndex.next(0);
      }
    });
  }

  /**
   * Select environment logs details at specified index
   * @param logIndex
   */
  public showLogDetails(logIndex: number) {
    this.initCollapse();
    this.selectedLogIndex.next(logIndex);
  }

  private initCollapse() {
    this.generalCollapsed = false;
    this.headersCollapsed = false;
    this.routeParamsCollapsed = false;
    this.queryParamsCollapsed = false;
    this.bodyCollapsed = false;
    this.responseGeneralCollapsed = false;
    this.responseHeadersCollapsed = false;
    this.responseBodyCollapsed = false;
  }

  /**
   * Set the environment logs active tab
   */
  public setActiveTab(tabName: EnvironmentLogsTabsNameType) {
    this.environmentsService.setActiveEnvironmentLogTab(tabName);
  }

  public createRouteFromLog(logUuid: string) {
    this.environmentsService.createRouteFromLog(logUuid);
  }
}
