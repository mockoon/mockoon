import { Component, DoCheck, Input, KeyValueDiffer, KeyValueDiffers, OnInit } from '@angular/core';
import { ServerService } from 'app/services/server.service';
import { EnvironmentType } from 'app/types/environment.type';
import { EnvironmentLogType } from 'app/types/server.type';

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
  private environmentsLogsDiffer: KeyValueDiffer<any, any>;
  private currentEnvironmentDiffer: KeyValueDiffer<any, any>;
  private currentLogsLastLength: number;

  constructor(private serverService: ServerService, private keyValueDiffers: KeyValueDiffers) {
    this.environmentsLogsDiffer = keyValueDiffers.find({}).create();
    this.currentEnvironmentDiffer = keyValueDiffers.find({}).create();
  }

  ngOnInit() { }

  /**
   * automatically select first item when switching environment, if any
   */
  ngDoCheck() {
    const currentLogs = this.environmentsLogs[this.currentEnvironment.uuid];

    const environmentsLogsChanges = this.environmentsLogsDiffer.diff(currentLogs);
    const currentEnvironmentChanges = this.currentEnvironmentDiffer.diff(this.currentEnvironment);

    if (currentEnvironmentChanges && currentLogs && currentLogs.length) {
      this.showLogDetails(0);
    }

    if (environmentsLogsChanges && currentLogs && currentLogs.length) {
      if (this.selectedLogIndex === undefined) {
        this.showLogDetails(0);
      } else if (this.currentLogsLastLength < currentLogs.length) {
        this.showLogDetails(this.selectedLogIndex + 1);
      }
    }

    if (currentLogs) {
      this.currentLogsLastLength = currentLogs.length;
    }
  }

  public showLogDetails(logIndex: number) {
    this.selectedLogIndex = logIndex;
    this.selectedLog = this.environmentsLogs[this.currentEnvironment.uuid][this.selectedLogIndex];
  }

  /**
   * Return request headers sorted
   */
  public getHeaders() {
    return Object.keys(this.selectedLog.request.headers).map((headerName) => {
      return { name: headerName, value: this.selectedLog.request.headers[headerName] }
    }).sort((a, b) => {
      if (a.name < b.name) {
        return -1
      } else {
        return 1;
      }
    });
  }
}
