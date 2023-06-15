import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { generateUUID } from '@mockoon/commons';
import { differenceInMilliseconds, endOfDay } from 'date-fns';
import {
  BehaviorSubject,
  combineLatest,
  from,
  Observable,
  of,
  race,
  Subject,
  timer
} from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
  map,
  startWith,
  switchMap,
  tap,
  throttleTime
} from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { TelemetrySession } from 'src/renderer/app/models/telemetry.model';
import { LocalStorageService } from 'src/renderer/app/services/local-storage.service';
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
    country: null,
    startTime: new Date().toISOString(),
    endTime: null,
    os: null,
    version: Config.appVersion,
    environmentsCount: null
  };
  private event$ = new Subject<void>();
  private closeSession$ = new BehaviorSubject<boolean>(false);
  private sessionInProgress$ = new BehaviorSubject<boolean>(true);

  constructor(
    private remoteConfigService: RemoteConfigService,
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private store: Store,
    private httpClient: HttpClient
  ) {}

  /**
   * Init the telemetry observable, automatically handling authorizations, data fetching, timers and request
   *
   * @returns
   */
  public init() {
    // only emit if telemetry is globally enabled, locally enabled and geoipEndpoint is available in remote config (cache)
    return combineLatest([
      this.remoteConfigService
        .get('enableTelemetry')
        .pipe(filter((enableTelemetry) => enableTelemetry)),
      this.remoteConfigService
        .get('geoipEndpoint')
        .pipe(filter((geoipEndpoint) => !!geoipEndpoint)),
      this.store.select('settings').pipe(
        filter((settings) => settings && settings.enableTelemetry),
        first()
      )
    ]).pipe(
      switchMap(([_enableTelemetry, geoipEndpoint, _settings]) =>
        combineLatest([this.getDataFromStorage(geoipEndpoint), this.getOS()])
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
      switchMap(() =>
        // end session and send infos after session duration inactivity or at midnight, or when app closes
        {
          const now = new Date();
          const midnight = endOfDay(now);

          return race(
            timer(Config.telemetry.sessionDuration),
            timer(differenceInMilliseconds(midnight, now)),
            this.closeSession$.pipe(filter((closeSession) => closeSession))
          );
        }
      ),
      switchMap((v) => {
        const environments = this.store.get('environments');

        return this.httpClient
          .post(`${Config.apiURL}events/telemetry`, {
            ...this.session,
            environmentsCount: environments.length
          })
          .pipe(catchError(() => of(true)));
      }),
      tap(() => {
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
  private getDataFromStorage(
    geoipEndpoint: string
  ): Observable<[string, string]> {
    return combineLatest([
      of(this.localStorageService.getItem('installationId') || generateUUID()),
      of(this.localStorageService.getItem('country')).pipe(
        switchMap((country) =>
          country
            ? of(country)
            : this.http
                .get(geoipEndpoint)
                .pipe(
                  map(
                    (location: { countryCode: string }) => location.countryCode
                  )
                )
        )
      )
    ]).pipe(
      tap(([installationId, country]) => {
        this.session.installationId = installationId;
        this.session.country = country;
        this.localStorageService.setItem('installationId', installationId);
        this.localStorageService.setItem('country', country);
      })
    );
  }

  /**
   * Get current OS from main process
   */
  private getOS() {
    return from(MainAPI.invoke('APP_GET_OS')).pipe(
      tap((os) => {
        this.session.os = os;
      })
    );
  }
}
