import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, merge } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { EventsService } from 'src/app/services/events.service';
import { Store } from 'src/app/stores/store';
import { environment } from 'src/environments/environment';

const appVersion = require('../../../package.json').version;

/**
 * Reference: https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide
 * All params: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Queue items before auth is ready with the uniq id. Then process the queue on ready.
 *
 * Custom dimensions:
 * - environmentsTotal = cd2
 *
 */

export type CollectParams = { type: 'event' | 'pageview', pageName?: string, category?: string, action?: string, label?: string };

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private endpoint = 'https://www.google-analytics.com/collect';
  private payload = {
    v: '1',
    an: 'mockoon',
    aid: 'com.mockoon.app',
    av: appVersion,
    ds: 'app',
    tid: environment.analyticsID,
    dh: encodeURIComponent('https://app.mockoon.com')
  };
  private queue: CollectParams[] = [];
  private servicesReady = false;

  constructor(
    private http: HttpClient,
    private eventsService: EventsService,
    private store: Store
  ) { }

  public init() {
    combineLatest(
      this.store.select('userId'),
      this.store.select('settings')
    ).pipe(
      filter(result => !!result[0] && !!result[1])
    ).subscribe(() => {
      this.servicesReady = true;

      this.queue.forEach((item) => {
        this.makeRequest(item);
      });

      this.queue = [];
    });

    const allEventsObservable = this.eventsService.analyticsEvents.pipe(
      filter((collectParams) => {
        return collectParams.action !== AnalyticsEvents.SERVER_ENTERING_REQUEST.action;
      })
    );

    // debounce entering request events every 2mn
    const enteringRequestEventsbservable = this.eventsService.analyticsEvents.pipe(
      filter((collectParams) => {
        return collectParams.action === AnalyticsEvents.SERVER_ENTERING_REQUEST.action;
      }),
      debounceTime(120000)
    );

    merge(allEventsObservable, enteringRequestEventsbservable).subscribe((event) => {
      this.collect(event);
    });
  }

  /**
   * Send a pageview or event to GA API
   *
   * @param params
   */
  private collect(params: CollectParams) {
    // if firebase auth not ready add to queue
    if (!this.servicesReady) {
      this.queue.push(params);
    } else {
      this.makeRequest(params);
    }
  }

  /**
   * Make a POST request to analytics endpoint
   */
  private makeRequest(params: CollectParams) {
    let payload;

    if (params.type === 'event') {
      payload = this.getPayload() + `&t=event&ec=${encodeURIComponent(params.category)}&ea=${encodeURIComponent(params.action)}`;

      if (params.label) {
        payload += `&el=${encodeURIComponent(params.label)}`;
      }
    } else if (params.type === 'pageview') {
      payload = this.getPayload() + `&t=pageview&dp=${encodeURIComponent(params.pageName)}`;
    }

    if (this.store.get('settings').analytics) {
      this.http.post(this.endpoint, payload, { responseType: 'text' }).subscribe();
    }
  }

  private getCustomDimensions(): string {
    const environments = this.store.get('environments');

    return `&cd2=${environments.length}`;
  }

  private getPayload(): string {
    let payload = '';

    Object.keys(this.payload).forEach((key, index) => {
      if (index > 0) {
        payload += '&';
      }
      payload += `${key}=${this.payload[key]}`;
    });

    payload += '&cid=' + this.store.get('userId') + this.getCustomDimensions();

    return payload;
  }
}
