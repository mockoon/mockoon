import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbTabChangeEvent, NgbTabset } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { EnvironmentLogsTabsNameType, Store } from 'src/app/stores/store';
import { EnvironmentLogsType } from 'src/app/types/server.type';

@Component({
  selector: 'app-environment-logs',
  templateUrl: 'environment-logs.component.html',
  styleUrls: ['environment-logs.component.scss']
})
export class EnvironmentLogsComponent implements OnInit, AfterViewInit {
  @Input() activeEnvironmentUUID$: Observable<string>;
  @Input() environmentsLogs$: Observable<EnvironmentLogsType>;
  @ViewChild(NgbTabset, { static: false }) logTabset: NgbTabset;
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
  public activeEnvironmentLogTab$: Observable<EnvironmentLogsTabsNameType>;
  private lastActiveEnvironmentLogTab: EnvironmentLogsTabsNameType;

  constructor(private store: Store) { }

  ngOnInit() {
    this.selectedLogIndex$ = this.selectedLogIndex.asObservable();

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

  ngAfterViewInit() {
    this.store.select('activeEnvironmentLogsTab').subscribe(
      activeEnvironmentLogTab => this.selectTab(activeEnvironmentLogTab),
      error => console.log('Select Environment Log tab error => ' + error)
    );
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
    this.bodyCollapsed = true;
    this.responseGeneralCollapsed = false;
    this.responseHeadersCollapsed = false;
    this.responseBodyCollapsed = false;
  }

  /**
   * Set active environment log tab
   */
  public async beforeTabChange($event: NgbTabChangeEvent) {
    let tab: EnvironmentLogsTabsNameType;
    if ($event.nextId === 'tab-request') {
      tab = 'REQUEST';
    } else {
      tab = 'RESPONSE';
    }

    if (this.lastActiveEnvironmentLogTab !== tab) {
      this.store.update({ type: 'SET_ACTIVE_ENVIRONMENT_LOG_TAB', item: tab });
    }
  }

  public async selectTab(tab: EnvironmentLogsTabsNameType) {
    if (this.lastActiveEnvironmentLogTab !== tab) {
      let tabId: string;
      if (tab === 'REQUEST') {
        tabId = 'tab-request';
      } else {
        tabId = 'tab-response';
      }

      if (this.logTabset != null && this.logTabset.activeId !== tabId) {
        // Prevent change tab loop
        this.lastActiveEnvironmentLogTab = tab;
        this.logTabset.select(tabId);
      }
    }
  }
}
