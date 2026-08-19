import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  throwError
} from 'rxjs';
import {
  AuthState,
  AuthStrategy
} from 'src/renderer/app/services/auth-strategies/auth-strategy.interface';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Config } from 'src/renderer/config';

type AuthTokens = { accessToken: string; refreshToken: string };

@Injectable({ providedIn: 'root' })
export class SelfHostedAuthStrategy implements AuthStrategy {
  private static readonly TOKEN_STORAGE_KEY = 'selfHostedAuthSession';
  // refresh ahead of the actual expiration to avoid using a token that expires in-flight
  private static readonly REFRESH_MARGIN = 60_000;

  private uiService = inject(UIService);
  private mainApiService = inject(MainApiService);
  private settingsService = inject(SettingsService);
  private httpClient = inject(HttpClient);

  private authState$ = new BehaviorSubject<AuthState>(null);
  // the access token is short lived and kept in memory only, only the refresh token is persisted
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshTimeout: ReturnType<typeof setTimeout> | null = null;
  private refreshInFlight$: Observable<string> | null = null;

  constructor() {
    this.restoreSessionFromStorage();
  }

  public observeAuthState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  public reloadUser() {
    if (!this.refreshToken) {
      return of(null);
    }

    return this.refreshTokens().pipe(catchError(() => of(null)));
  }

  /**
   * Exchange a one time auth code for an access token and a refresh token
   */
  public authWithToken(code: string) {
    const normalizedCode = code?.trim();

    if (!normalizedCode) {
      return throwError(() => new Error('INVALID_TOKEN'));
    }

    return this.settingsService.selectApiUrl().pipe(
      switchMap((apiUrl) =>
        this.httpClient
          .post<AuthTokens>(`${apiUrl}auth/exchange`, { code: normalizedCode })
          .pipe(map((tokens) => ({ apiUrl, tokens })))
      ),
      tap(({ apiUrl, tokens }) => {
        this.applyTokens(apiUrl, tokens);
      }),
      catchError((error) => {
        this.clearSession();

        return throwError(() => error);
      })
    );
  }

  public getToken(force = false) {
    if (!this.refreshToken) {
      return of(this.accessToken);
    }

    if (!force && this.accessToken && !this.isTokenExpiring(this.accessToken)) {
      return of(this.accessToken);
    }

    return this.refreshTokens().pipe(catchError(() => of(null)));
  }

  public startLoginFlow() {
    this.uiService.openModal('auth');

    if (Config.isWeb) {
      return;
    }

    this.settingsService
      .selectApiUrl()
      .pipe(
        take(1),
        tap((apiUrl) => {
          this.mainApiService.send('APP_AUTH', `${apiUrl}login`);
        })
      )
      .subscribe();
  }

  public logout() {
    const refreshToken = this.refreshToken;

    this.clearSession();

    if (!refreshToken) {
      return of(null);
    }

    return this.settingsService.selectApiUrl().pipe(
      switchMap((apiUrl) =>
        this.httpClient.post(`${apiUrl}auth/logout`, { refreshToken })
      ),
      catchError(() => of(null))
    );
  }

  private refreshTokens(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.refreshToken;

    if (!refreshToken) {
      return throwError(() => new Error('INVALID_TOKEN'));
    }

    this.refreshInFlight$ = this.settingsService.selectApiUrl().pipe(
      switchMap((apiUrl) =>
        this.httpClient
          .post<AuthTokens>(`${apiUrl}auth/refresh`, { refreshToken })
          .pipe(map((tokens) => ({ apiUrl, tokens })))
      ),
      map(({ apiUrl, tokens }) => {
        this.applyTokens(apiUrl, tokens);

        return tokens.accessToken;
      }),
      catchError((error) => {
        this.clearSession();

        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshInFlight$;
  }

  private applyTokens(apiUrl: string, tokens: AuthTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    this.persistSession(apiUrl, tokens.refreshToken);
    this.scheduleRefresh(tokens.accessToken);
    this.authState$.next({ authenticated: true });
  }

  private scheduleRefresh(accessToken: string) {
    this.clearScheduledRefresh();

    const expiration = this.getTokenExpiration(accessToken);

    if (!expiration) {
      return;
    }

    const delay = Math.max(
      expiration - Date.now() - SelfHostedAuthStrategy.REFRESH_MARGIN,
      5000
    );

    this.refreshTimeout = setTimeout(() => {
      this.refreshTokens().subscribe({ error: () => undefined });
    }, delay);
  }

  private clearScheduledRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  private clearSession() {
    this.clearScheduledRefresh();
    this.accessToken = null;
    this.refreshToken = null;
    this.clearPersistedSession();
    this.authState$.next(null);
  }

  private isTokenExpiring(accessToken: string) {
    const expiration = this.getTokenExpiration(accessToken);

    if (!expiration) {
      return true;
    }

    return Date.now() >= expiration - SelfHostedAuthStrategy.REFRESH_MARGIN;
  }

  private getTokenExpiration(accessToken: string): number | null {
    const payload = accessToken.split('.')[1];

    if (!payload) {
      return null;
    }

    try {
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      ) as { exp?: number };

      return typeof decoded?.exp === 'number' ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private persistSession(apiUrl: string, refreshToken: string) {
    localStorage.setItem(
      SelfHostedAuthStrategy.TOKEN_STORAGE_KEY,
      JSON.stringify({ refreshToken, apiUrl })
    );
  }

  private restoreSessionFromStorage() {
    const storedSession = this.parseStoredSession(
      localStorage.getItem(SelfHostedAuthStrategy.TOKEN_STORAGE_KEY)
    );

    if (!storedSession) {
      this.clearPersistedSession();

      return;
    }

    this.settingsService
      .selectApiUrl()
      .pipe(
        take(1),
        switchMap((apiUrl) => {
          // never send a refresh token to another backend than the one it was issued for
          if (apiUrl !== storedSession.apiUrl) {
            this.clearPersistedSession();

            return of(null);
          }

          this.refreshToken = storedSession.refreshToken;

          return this.refreshTokens().pipe(catchError(() => of(null)));
        })
      )
      .subscribe();
  }

  private parseStoredSession(storedSessionRaw: string | null) {
    if (!storedSessionRaw) {
      return null;
    }

    try {
      const parsed = JSON.parse(storedSessionRaw) as {
        refreshToken?: string;
        apiUrl?: string;
      };

      const refreshToken = parsed?.refreshToken?.trim();
      const apiUrl = parsed?.apiUrl;

      if (!refreshToken || !apiUrl) {
        return null;
      }

      return { refreshToken, apiUrl };
    } catch {
      return null;
    }
  }

  private clearPersistedSession() {
    localStorage.removeItem(SelfHostedAuthStrategy.TOKEN_STORAGE_KEY);
  }
}
