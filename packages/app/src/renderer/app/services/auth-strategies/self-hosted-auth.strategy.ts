import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
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

@Injectable({ providedIn: 'root' })
export class SelfHostedAuthStrategy implements AuthStrategy {
  private static readonly TOKEN_STORAGE_KEY = 'selfHostedAuthSession';

  private uiService = inject(UIService);
  private mainApiService = inject(MainApiService);
  private settingsService = inject(SettingsService);
  private httpClient = inject(HttpClient);

  private authState$ = new BehaviorSubject<AuthState>(null);
  private token: string | null = null;

  constructor() {
    this.restoreTokenFromStorage();
  }

  public observeAuthState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  public reloadUser() {
    if (this.token) {
      this.authState$.next({ authenticated: true });
    }

    return of(null);
  }

  public authWithToken(token: string) {
    const normalizedToken = token?.trim();

    if (!normalizedToken) {
      return throwError(() => new Error('INVALID_TOKEN'));
    }

    return this.settingsService.selectApiUrl().pipe(
      switchMap((apiUrl) =>
        this.verifyToken(apiUrl, normalizedToken).pipe(
          map((isValid) => ({ apiUrl, isValid }))
        )
      ),
      tap(({ apiUrl, isValid }) => {
        if (!isValid) {
          throw new Error('INVALID_TOKEN');
        }

        this.token = normalizedToken;
        this.persistToken(apiUrl, normalizedToken);
        this.authState$.next({ authenticated: true });
      }),
      catchError((error) => {
        this.token = null;
        this.clearPersistedToken();
        this.authState$.next(null);

        return throwError(() => error);
      })
    );
  }

  public getToken() {
    return of(this.token);
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
    this.token = null;
    this.clearPersistedToken();
    this.authState$.next(null);

    return of(null);
  }

  private persistToken(apiUrl: string, token: string) {
    localStorage.setItem(
      SelfHostedAuthStrategy.TOKEN_STORAGE_KEY,
      JSON.stringify({ token, apiUrl })
    );
  }

  private restoreTokenFromStorage() {
    const storedSessionRaw = localStorage.getItem(
      SelfHostedAuthStrategy.TOKEN_STORAGE_KEY
    );
    const storedSession = this.parseStoredSession(storedSessionRaw);

    if (!storedSession) {
      this.clearPersistedToken();

      return;
    }

    this.settingsService
      .selectApiUrl()
      .pipe(
        take(1),
        switchMap((apiUrl) => {
          if (apiUrl !== storedSession.apiUrl) {
            return of(false);
          }

          return this.verifyToken(apiUrl, storedSession.token);
        }),
        tap((isValid) => {
          if (!isValid) {
            this.token = null;
            this.clearPersistedToken();
            this.authState$.next(null);

            return;
          }

          this.token = storedSession.token;
          this.authState$.next({ authenticated: true });
        }),
        catchError(() => {
          this.token = null;
          this.clearPersistedToken();
          this.authState$.next(null);

          return of(null);
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
        token?: string;
        apiUrl?: string;
      };

      const token = parsed?.token?.trim();
      const apiUrl = parsed?.apiUrl;

      if (!token || !apiUrl) {
        return null;
      }

      return { token, apiUrl };
    } catch {
      return null;
    }
  }

  private verifyToken(apiUrl: string, token: string) {
    return this.httpClient
      .post(`${apiUrl}auth/verify`, {
        token
      })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  private clearPersistedToken() {
    localStorage.removeItem(SelfHostedAuthStrategy.TOKEN_STORAGE_KEY);
  }
}
