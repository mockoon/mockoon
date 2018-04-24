import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Config } from 'app/config';
import { EnvironmentsService } from 'app/services/environments.service';
import { AuthService } from 'app/services/auth.service';
import { SettingsType, SettingsService } from 'app/services/settings.service';

/**
 * Reference: https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide
 * All params: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Queue items before auth is ready with the uniq id. Then process the queue on ready.
 *
 * Custom dimensions:
 * - routesTotal = cd1
 * - environmentsTotal = cd2
 *
 */

export type CollectParams = { type: 'event' | 'pageview', pageName?: string, category?: string, action?: string, label?: string };

@Injectable()
export class AnalyticsService {
  private settings: SettingsType;
  private endpoint = 'https://www.google-analytics.com/collect';
  private payload = {
    v: '1',
    an: 'mockoon',
    aid: 'com.mockoon.app',
    av: Config.version,
    ds: 'app',
    tid: 'UA-7759211-13',
    dh: encodeURIComponent('https://app.mockoon.com')
  };
  private userId = '1';

  private queue: CollectParams[] = [];

  constructor(private http: Http, private environmentsService: EnvironmentsService, private authService: AuthService, private settingsService: SettingsService) {
    // wait for auth to be ready before processing the eventual queue
    this.authService.authReady.subscribe((ready) => {
      if (ready) {
        this.queue.forEach((item) => {
          this.makeRequest(item);
        });

        this.queue = [];
      }
    });

    // wait for settings to be ready and check if display needed
    this.settingsService.settingsReady.subscribe((ready) => {
      if (ready) {
        this.settings = this.settingsService.settings;
      }
    });
  }

  /**
   * Send a pageview or event to GA API
   *
   * @param params
   */
  public collect(params: CollectParams) {
    // if firebase auth not ready add to queue
    if (!this.authService.userId) {
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

    if (this.settings.analytics) {
      this.http.post(this.endpoint, payload).subscribe();
    }
  }

  private getCustomDimensions(): string {
    const environmentsTotal = this.environmentsService.environments.length;
    const routesTotal = this.environmentsService.routesTotal;

    return `&cd1=${routesTotal}&cd2=${environmentsTotal}`;
  }

  private getCid(): string {
    if (this.authService.userId) {
      return '&cid=' + this.authService.userId;
    } else {
      return '';
    }
  }

  private getPayload(): string {
    let payload = '';

    Object.keys(this.payload).forEach((key, index) => {
      if (index > 0) {
        payload += '&';
      }
      payload += `${key}=${this.payload[key]}`
    });

    payload += this.getCid() + this.getCustomDimensions();

    return payload;
  }
}
