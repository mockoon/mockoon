import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { User } from '@mockoon/cloud';
import {
  catchError,
  combineLatest,
  EMPTY,
  filter,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  withLatestFrom
} from 'rxjs';
import { AuthStrategy } from 'src/renderer/app/services/auth-strategies/auth-strategy.interface';
import { FirebaseAuthStrategy } from 'src/renderer/app/services/auth-strategies/firebase-auth.strategy';
import { SelfHostedAuthStrategy } from 'src/renderer/app/services/auth-strategies/self-hosted-auth.strategy';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import {
  updateDeployInstancesAction,
  updateFeedbackAction,
  updateSyncAction,
  updateUserAction
} from 'src/renderer/app/stores/actions';
import { Store, storeDefaultState } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Service()
export class UserService {
  private httpClient = inject(HttpClient);
  private store = inject(Store);
  private firebaseAuthStrategy = inject(FirebaseAuthStrategy);
  private selfHostedAuthStrategy = inject(SelfHostedAuthStrategy);
  private settingsService = inject(SettingsService);
  private uiService = inject(UIService);
  private loggerService = inject(LoggerService);
  private isWeb = Config.isWeb;
  private lastUserRefresh = 0;

  /**
   * Monitor auth token state and update the store
   */
  public init() {
    return this.selectAuthStrategy().pipe(
      switchMap((authStrategy) => authStrategy.observeAuthState()),
      switchMap((authUser) => {
        if (authUser) {
          return this.getUserInfo(true);
        }

        this.resetUserData();

        return of(null);
      })
    );
  }

  public authStateChanges() {
    return this.selectAuthStrategy().pipe(
      switchMap((authStrategy) => authStrategy.observeAuthState()),
      filter((user) => !!user)
    );
  }

  /**
   * Reload the user info
   * Can be used to trigger an authentication after going offline
   */
  public reloadUser() {
    return this.selectAuthStrategy().pipe(
      switchMap((authStrategy) => authStrategy.reloadUser())
    );
  }

  /**
   * Sign in with custom token
   *
   * @param token
   * @returns
   */
  public authWithToken(token: string) {
    return this.selectAuthStrategy().pipe(
      switchMap((authStrategy) => authStrategy.authWithToken(token))
    );
  }

  /**
   * Get the user info.
   * Only refreshes the list if the last refresh
   * was more than `dataRefreshInterval` ago or if
   * `force` is true.
   *
   * @param force - Force a refresh of the instances
   * @returns
   */
  public getUserInfo(force = false) {
    const dataRefreshInterval = this.store.getRemoteConfig(
      'dataRefreshInterval'
    );
    const now = Date.now();

    if (now - this.lastUserRefresh < dataRefreshInterval && !force) {
      return EMPTY;
    }

    this.lastUserRefresh = now;

    return this.getToken().pipe(
      withLatestFrom(this.settingsService.selectApiUrl()),
      switchMap(([token, apiUrl]) =>
        this.httpClient.get(`${apiUrl}user`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ),
      tap((user: User) => {
        this.store.update(updateUserAction(user));
      }),
      catchError(() => EMPTY)
    );
  }

  /**
   * Get the current ID token
   *
   * @param force
   * @returns
   */
  public getToken(force = false): Observable<string | null> {
    return this.selectAuthStrategy().pipe(
      switchMap((authStrategy) => authStrategy.getToken(force))
    );
  }

  /**
   * Start the login flow
   * Open the auth modal and send the APP_AUTH event to the main process
   */
  public startLoginFlow() {
    this.selectAuthStrategy()
      .pipe(
        take(1),
        tap((authStrategy) => {
          authStrategy.startLoginFlow();
        })
      )
      .subscribe();
  }

  /**
   * Process the auth callback token and display a toast
   *
   * @param token
   * @returns
   */
  public authCallbackHandler(token: string) {
    return this.authWithToken(token).pipe(
      tap(() => {
        this.uiService.closeModal('auth');
        this.loggerService.logMessage('info', 'LOGIN_SUCCESS');
      }),
      catchError(() => {
        this.loggerService.logMessage('error', 'LOGIN_ERROR');

        return EMPTY;
      })
    );
  }

  /**
   * Process the auth callback token and display a toast
   * Used in the web app (shouldn't be used in the desktop app)
   *
   * @param token
   * @returns
   */
  public webAuthCallbackHandler(token: string) {
    return this.authWithToken(token).pipe(
      tap(() => {
        this.loggerService.logMessage('info', 'LOGIN_SUCCESS');
      }),
      map(() => true),
      catchError(() => {
        this.loggerService.logMessage('error', 'LOGIN_ERROR');

        return EMPTY;
      })
    );
  }

  /**
   * Handle the web app auth flow: open the auth iframe modal if not authenticated
   * Do nothing if the welcome modal has already been shown,
   * it will open the auth iframe modal after the user closes it
   *
   * Used in the web app (shouldn't be used in the desktop app)
   *
   * @returns
   */
  public webAuthHandler() {
    const callbackToken = this.getWebAuthTokenFromUrl();

    if (callbackToken) {
      this.clearWebAuthTokenFromUrl();

      return this.webAuthCallbackHandler(callbackToken);
    }

    return this.selectAuthStrategy()
      .pipe(
        switchMap((authStrategy) =>
          combineLatest([
            authStrategy.observeAuthState(),
            this.store.select('settings')
          ])
        )
      )
      .pipe(
        take(1),
        tap(([user, settings]) => {
          if (!user && settings.welcomeShown) {
            this.startLoginFlow();
          }
        }),
        map(() => true)
      );
  }

  private getWebAuthTokenFromUrl() {
    if (!Config.isWeb) {
      return null;
    }

    const url = new URL(window.location.href);

    return url.searchParams.get('token');
  }

  private clearWebAuthTokenFromUrl() {
    if (!Config.isWeb) {
      return;
    }

    const url = new URL(window.location.href);

    url.searchParams.delete('token');

    window.history.replaceState({}, document.title, url.toString());
  }

  /**
   * Logout firebase and update the store
   * In the web app, redirect to the website
   * after logout
   *
   * @returns
   */
  public logout() {
    return this.selectAuthStrategy().pipe(
      switchMap((authStrategy) => authStrategy.logout()),
      tap(() => {
        this.resetUserData();

        if (this.isWeb) {
          window.location.href = Config.websiteUrl;
        }
      })
    );
  }

  private selectAuthStrategy(): Observable<AuthStrategy> {
    return this.settingsService
      .selectIsApiUrlOverridden()
      .pipe(
        switchMap((isApiUrlOverridden) =>
          of(
            isApiUrlOverridden
              ? this.selfHostedAuthStrategy
              : this.firebaseAuthStrategy
          )
        )
      );
  }

  public sendFeedback(message: string) {
    return this.getToken().pipe(
      withLatestFrom(this.settingsService.selectApiUrl()),
      switchMap(([token, apiUrl]) =>
        this.httpClient.post(
          `${apiUrl}user/feedback`,
          { message },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
      ),
      tap(() => {
        this.store.update(updateFeedbackAction(''));

        this.loggerService.logMessage('info', 'FEEDBACK_SEND_SUCCESS');
      }),
      catchError(() => {
        this.loggerService.logMessage('error', 'FEEDBACK_SEND_ERROR');

        return EMPTY;
      })
    );
  }

  private resetUserData() {
    this.store.update(
      updateDeployInstancesAction(storeDefaultState.deployInstances)
    );
    this.store.update(updateUserAction(storeDefaultState.user));
    this.store.update(updateSyncAction(storeDefaultState.sync));
  }
}
