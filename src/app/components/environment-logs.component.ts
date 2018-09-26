import { Component, DoCheck, Input, KeyValueDiffer, KeyValueDiffers, OnInit } from '@angular/core';
import { ServerService } from 'src/app/services/server.service';
import { EnvironmentType } from 'src/app/types/environment.type';
import { EnvironmentLogType } from 'src/app/types/server.type';

@Component({
  selector: 'app-environment-logs',
  templateUrl: 'environment-logs.component.html',
  styleUrls: ['environment-logs.component.scss']
})
export class EnvironmentLogsComponent implements OnInit, DoCheck {
  @Input() currentEnvironment: EnvironmentType;
  public selectedLog: EnvironmentLogType;
  public selectedLogIndex: number;
  public environmentsLogs = this.serverService.environmentsLogs;
  public generalCollapsed: boolean;
  public headersCollapsed: boolean;
  public routeParamsCollapsed: boolean;
  public queryParamsCollapsed: boolean;
  public bodyCollapsed: boolean;
  private environmentsLogsDiffer: KeyValueDiffer<any, any>;
  private currentEnvironmentDiffer: KeyValueDiffer<any, any>;
  private currentLogsLastLength: number;

  constructor(private serverService: ServerService, private keyValueDiffers: KeyValueDiffers) {
    this.environmentsLogsDiffer = this.keyValueDiffers.find({}).create();
    this.currentEnvironmentDiffer = this.keyValueDiffers.find({}).create();
  }

  ngOnInit() {
    this.initCollapse();
  }

  /**
   * automatically select first item when switching environment, if any
   */
  ngDoCheck() {
    const currentLogs = this.environmentsLogs[this.currentEnvironment.uuid];

    const environmentsLogsChanges = this.environmentsLogsDiffer.diff(currentLogs);
    const currentEnvironmentChanges = this.currentEnvironmentDiffer.diff(this.currentEnvironment);

    if (currentEnvironmentChanges) {
      if (currentLogs && currentLogs.length) {
        this.showLogDetails(0);
      } else {
        this.resetSelectedLog();
      }
    }

    if (environmentsLogsChanges) {
      if (currentLogs && currentLogs.length) {
        if (this.selectedLogIndex === undefined) {
          this.showLogDetails(0);
        } else if (this.currentLogsLastLength < currentLogs.length) {
          this.showLogDetails(this.selectedLogIndex + 1);
        }
      } else {
        this.resetSelectedLog();
      }
    }

    if (currentLogs) {
      this.currentLogsLastLength = currentLogs.length;
    }
  }

  private resetSelectedLog() {
    this.initCollapse();
    this.selectedLogIndex = undefined;
    this.selectedLog = undefined;
  }

  public showLogDetails(logIndex: number) {
    this.initCollapse();
    this.selectedLogIndex = logIndex;
    this.selectedLog = this.environmentsLogs[this.currentEnvironment.uuid][this.selectedLogIndex];
  }

  private initCollapse() {
    this.generalCollapsed = false;
    this.headersCollapsed = false;
    this.routeParamsCollapsed = false;
    this.queryParamsCollapsed = false;
    this.bodyCollapsed = true;
  }
}
