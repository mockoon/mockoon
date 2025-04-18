import { Injectable } from '@angular/core';
import { Plans } from '@mockoon/cloud';
import { generateUUID } from '@mockoon/commons';
import { differenceInMilliseconds, endOfDay } from 'date-fns';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  from,
  of,
  race,
  timer
} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  first,
  startWith,
  switchMap,
  tap,
  throttleTime
} from 'rxjs/operators';
import { TelemetrySession } from 'src/renderer/app/models/telemetry.model';
import { LocalStorageService } from 'src/renderer/app/services/local-storage.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { RemoteConfigService } from 'src/renderer/app/services/remote-config.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private session: TelemetrySession = {
    installationId: null,
    firstSession: false,
    startTime: new Date().toISOString(),
    endTime: null,
    os: null,
    version: Config.appVersion,
    environmentsCount: null,
    app: Config.isWeb ? 'web' : 'desktop',
    auth: false,
    paid: false
  };
  private event$ = new Subject<void>();
  private closeSession$ = new BehaviorSubject<boolean>(false);
  private sessionInProgress$ = new BehaviorSubject<boolean>(true);

  constructor(
    private remoteConfigService: RemoteConfigService,
    private localStorageService: LocalStorageService,
    private store: Store,
    private mainApiService: MainApiService
  ) {}

  /**
   * Init the telemetry observable, automatically handling authorizations, data fetching, timers and request
   *
   * @returns
   */
  public init() {
    // only emit if telemetry is globally and locally enabled
    return combineLatest([
      this.remoteConfigService
        .get('enableTelemetry')
        .pipe(filter((enableTelemetry) => enableTelemetry)),
      this.store.select('settings').pipe(
        filter((settings) => settings?.enableTelemetry),
        first()
      )
    ]).pipe(
      switchMap(([_enableTelemetry, _settings]) =>
        combineLatest([this.getDataFromStorage(), this.getOS()])
      ),
      switchMap(() =>
        this.event$.pipe(
          // immediately start the event observable
          startWith(undefined as void),
          throttleTime(1000, undefined, { trailing: true }),
          filter(() => !this.closeSession$.value),
          tap(() => {
            this.sessionInProgress$.next(true);

            // start a new session if we are not already in one
            if (!this.session.startTime) {
              this.session.startTime = new Date().toISOString();
            }
            this.session.endTime = new Date().toISOString();
          })
        )
      ),
      switchMap(() => {
        // end session and send infos after session duration inactivity or at midnight, or when app closes
        const now = new Date();
        const midnight = endOfDay(now);

        return race(
          timer(Config.telemetry.sessionDuration),
          timer(differenceInMilliseconds(midnight, now)),
          this.closeSession$.pipe(filter((closeSession) => closeSession))
        );
      }),
      tap(() => {
        const environments = this.store.get('environments');
        const user = this.store.get('user');

        navigator.sendBeacon(
          `${Config.apiURL}events/telemetry`,
          JSON.stringify({
            ...this.session,
            environmentsCount: environments.length,
            auth: !!user,
            paid: !!user && user.plan !== Plans.FREE
          } as TelemetrySession)
        );

        this.sessionInProgress$.next(false);

        // reset session start time after it has been sent
        this.session.startTime = new Date().toISOString();
        this.session.firstSession = false;
      })
    );
  }

  /**
   * Session in progress observable value
   */
  public sessionInProgress() {
    return this.sessionInProgress$.asObservable().pipe(distinctUntilChanged());
  }

  /**
   * Set flag for app first load
   */
  public setFirstSession() {
    this.session.firstSession = true;
  }

  /**
   * Send an event increasing the session duration
   */
  public sendEvent() {
    this.event$.next();
  }

  /**
   * Send an event to manually close the session (app close)
   */
  public closeSession() {
    this.closeSession$.next(true);
  }

  /**
   * Get stored user data or create them
   */
  private getDataFromStorage() {
    return of(
      this.localStorageService.getItem('installationId') || generateUUID()
    ).pipe(
      tap((installationId) => {
        this.session.installationId = installationId;
        this.localStorageService.setItem('installationId', installationId);
      })
    );
  }

  /**
   * Get current OS from main process
   */
  private getOS() {
    return from(this.mainApiService.invoke('APP_GET_OS')).pipe(
      tap((os) => {
        this.session.os = os;
      })
    );
  }
}
