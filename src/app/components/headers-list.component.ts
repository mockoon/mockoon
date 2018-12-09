import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { EventsService } from 'src/app/services/events.service';
import { ServerService } from 'src/app/services/server.service';
import { headerNames, HeaderType, headerValues } from 'src/app/types/route.type';
import * as uuid from 'uuid/v1';

@Component({
  selector: 'app-headers-list',
  templateUrl: 'headers-list.component.html'
})
export class HeadersListComponent implements OnInit {
  @Input() headersList: HeaderType[];
  @Input() type: 'routeHeaders' | 'environmentHeaders';
  @Output() headersUpdated: EventEmitter<any> = new EventEmitter();
  @Output() headerAdded: EventEmitter<any> = new EventEmitter();

  public headerNamesList = headerNames;
  public headerValuesList = headerValues;
  public testHeaderValidity = this.serverService.testHeaderValidity;
  public containersList = {
    routeHeaders: '.route-headers',
    environmentHeaders: '.environment-headers'
  };

  constructor(private serverService: ServerService, private eventsService: EventsService) { }

  ngOnInit() { }

  /**
   * Add a new header to the list if possible
   */
  public addHeader() {
    const lastHeader = this.headersList[this.headersList.length - 1];

    if (lastHeader.key !== '') {
      this.headersList.push({ uuid: uuid(), key: '', value: '' });
      this.headersUpdated.emit();

      this.eventsService.analyticsEvents.next(AnalyticsEvents.CREATE_HEADER);

      this.headerAdded.emit();
    }
  }

  /**
   * Remove a header from the list
   *
   * @param headerUUID
   */
  public removeHeader(headerUUID: string) {
    const headerIndex = this.headersList.findIndex((header: any) => {
      return header.uuid === headerUUID;
    });

    if (headerIndex > -1) {
      this.headersList.splice(headerIndex, 1);

      this.eventsService.analyticsEvents.next(AnalyticsEvents.DELETE_HEADER);
    }
    this.headersUpdated.emit();
  }

  public triggerUpdate() {
    this.headersUpdated.emit();
  }
}
