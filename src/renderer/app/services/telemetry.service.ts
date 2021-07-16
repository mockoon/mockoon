import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { differenceInMilliseconds, endOfDay } from 'date-fns';
import {
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
  debounceTime,
  filter,
  first,
  map,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';
import { Config } from 'src/renderer/app/config';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { TelemetrySession } from 'src/renderer/app/models/telemetry.model';
import { LocalStorageService } from 'src/renderer/app/services/local-storage.service';
import { RemoteConfigService } from 'src/renderer/app/services/remote-config.service';
import { Store } from 'src/renderer/app/stores/store';
import { v4 as uuid } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private session: TelemetrySession = {
    installationId: null,
    firstSession: false,
    country: null,
    startTime: null,
    endTime: null,
    os: null,
    version: Config.appVersion,
    environmentsCount: null
  };
  private event$ = new Subject();
  private closeSession$ = new Subject();

  constructor(
    private remoteConfigService: RemoteConfigService,
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private store: Store,
    private firebaseFunctions: AngularFireFunctions
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
          debounceTime(1000),
          tap(() => {
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
            this.closeSession$
          );
        }
      ),
      switchMap(() => {
        const environments = this.store.get('environments');

        return this.firebaseFunctions
          .httpsCallable(Config.telemetry.functionName)({
            ...this.session,
            environmentsCount: environments.length
          })
          .pipe(catchError(() => of(true)));
      }),
      tap(() => {
        // reset session start time after it has been sent
        this.session.startTime = null;
        this.session.firstSession = false;
      })
    );
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
    this.closeSession$.next();
  }

  /**
   * Get stored user data or create them
   */
  private getDataFromStorage(
    geoipEndpoint: string
  ): Observable<[string, string]> {
    return combineLatest([
      of(this.localStorageService.getItem('installationId') || uuid()),
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
