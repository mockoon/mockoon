import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { merge } from 'rxjs';
import { debounceTime, filter, first, tap } from 'rxjs/operators';
import { Config } from 'src/renderer/app/config';
import { AnalyticsEvents } from 'src/renderer/app/enums/analytics-events.enum';
import { Settings } from 'src/renderer/app/models/settings.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { LocalStorageService } from 'src/renderer/app/services/local-storage.service';
import { Store } from 'src/renderer/app/stores/store';
import { environment } from 'src/renderer/environments/environment';

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

export type CollectParams = {
  type: 'event' | 'pageview';
  pageName?: string;
  category?: string;
  action?: string;
};

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private endpoint = 'https://www.google-analytics.com/collect';
  private payload = {
    v: '1',
    an: 'mockoon',
    aid: 'com.mockoon.app',
    av: Config.appVersion,
    ds: 'app',
    tid: environment.analyticsID,
    dh: encodeURIComponent('https://app.mockoon.com')
  };
  private queue: CollectParams[] = [];
  private servicesReady = false;

  constructor(
    private http: HttpClient,
    private eventsService: EventsService,
    private store: Store,
    private localStorageService: LocalStorageService
  ) {}

  public init() {
    this.store
      .select('settings')
      .pipe(
        filter<Settings>(Boolean),
        first(),
        tap((settings) => {
          this.servicesReady = true;

          this.queue.forEach((item) => {
            this.makeRequest(item);
          });

          this.queue = [];
        })
      )
      .subscribe();

    const allEventsObservable = this.eventsService.analyticsEvents.pipe(
      filter(
        (collectParams) =>
          collectParams.action !==
          AnalyticsEvents.SERVER_ENTERING_REQUEST.action
      )
    );

    // debounce entering request events every 2mn
    const enteringRequestEventsbservable =
      this.eventsService.analyticsEvents.pipe(
        filter(
          (collectParams) =>
            collectParams.action ===
            AnalyticsEvents.SERVER_ENTERING_REQUEST.action
        ),
        debounceTime(29 * 60 * 1000)
      );

    merge(allEventsObservable, enteringRequestEventsbservable).subscribe(
      (event) => {
        this.collect(event);
      }
    );
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
      payload =
        this.getPayload() +
        `&t=event&ec=${encodeURIComponent(
          params.category
        )}&ea=${encodeURIComponent(params.action)}`;
    } else if (params.type === 'pageview') {
      payload =
        this.getPayload() +
        `&t=pageview&dp=${encodeURIComponent(params.pageName)}`;
    }

    if (this.store.get('settings').analytics) {
      this.http
        .post(this.endpoint, payload, { responseType: 'text' })
        .subscribe();
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

    payload +=
      '&cid=' +
      this.localStorageService.getItem('installationId') +
      this.getCustomDimensions();

    return payload;
  }
}
