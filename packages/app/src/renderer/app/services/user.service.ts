import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Auth,
  authState,
  idToken,
  reload,
  signInWithCustomToken
} from '@angular/fire/auth';
import { User } from '@mockoon/cloud';
import {
  catchError,
  EMPTY,
  filter,
  from,
  mergeMap,
  of,
  switchMap,
  take,
  tap,
  throwError
} from 'rxjs';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import {
  updateDeployInstancesAction,
  updateUserAction
} from 'src/renderer/app/stores/actions';
import { Store, storeDefaultState } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { environment as env } from 'src/renderer/environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private isWeb = env.web;
  private auth: Auth = inject(Auth);
  private idToken$ = idToken(this.auth);

  constructor(
    private httpClient: HttpClient,
    private store: Store,
    private uiService: UIService,
    private mainApiService: MainApiService,
    private loggerService: LoggerService
  ) {}

  /**
   * Monitor auth token state and update the store
   */
  public init() {
    return this.idToken$.pipe(
      filter((token) => !!token),
      mergeMap(() => this.getUserInfo())
    );
  }

  /**
   * Reload the user info
   * Can be used to trigger an authentication after going offline
   */
  public reloadUser() {
    reload(this.auth.currentUser);
  }

  /**
   * Sign in with custom token
   *
   * @param token
   * @returns
   */
  public authWithToken(token: string) {
    return from(signInWithCustomToken(this.auth, token)).pipe(
      catchError((error) => throwError(() => new Error(error)))
    );
  }

  /**
   * Get user info from the server and update the store
   *
   * @returns
   */
  public getUserInfo() {
    return from(this.auth.currentUser.getIdToken()).pipe(
      switchMap((token) =>
        this.httpClient.get(`${Config.apiURL}user`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ),
      tap((info: User) => {
        this.store.update(updateUserAction({ ...info }));
      }),
      catchError(() => EMPTY)
    );
  }

  public getIdToken() {
    if (this.auth?.currentUser) {
      return from(this.auth.currentUser.getIdToken());
    }

    return of(null);
  }

  public idTokenChanges() {
    return this.idToken$;
  }

  public refreshToken() {
    return from(this.auth.currentUser.getIdToken(true));
  }

  /**
   * Start the login flow
   * Open the auth modal and send the APP_AUTH event to the main process
   */
  public startLoginFlow() {
    if (env.web) {
      this.redirectToLogin();
    } else {
      this.uiService.openModal('auth');
      this.mainApiService.send('APP_AUTH');
    }
  }

  public stopAuthFlow() {
    this.mainApiService.send('APP_AUTH_STOP_SERVER');
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

        this.stopAuthFlow();
      }),
      catchError(() => {
        this.loggerService.logMessage('error', 'LOGIN_ERROR');

        return EMPTY;
      })
    );
  }

  /**
   * Process the token query param and authenticate the user.
   * If no token is present, check if a redirect to the login page is needed.
   *
   * Used in the web app (shouldn't be used in the desktop app)
   *
   * @returns
   */
  public authQueryParamHandler(): any {
    const token = new URLSearchParams(window.location.search).get('token');

    if (token) {
      return this.authWithToken(token).pipe(
        tap(() => {
          this.loggerService.logMessage('info', 'LOGIN_SUCCESS');
          this.cleanBrowserUrl();
        }),
        catchError(() => {
          this.loggerService.logMessage('error', 'LOGIN_ERROR');
          this.cleanBrowserUrl();

          return EMPTY;
        })
      );
    }

    return authState(this.auth).pipe(
      take(1),
      tap((user) => {
        if (!user) {
          window.location.href = `${Config.appAuthURL}?webapp=true`;
        }
      })
    );
  }

  public logout() {
    return from(this.auth.signOut()).pipe(
      tap(() => {
        this.store.update(
          updateDeployInstancesAction(storeDefaultState.deployInstances)
        );
        this.store.update(updateUserAction(storeDefaultState.user));

        if (this.isWeb) {
          window.location.href = Config.websiteURL;
        }
      })
    );
  }

  /**
   * Remove the path and query params from the browser URL
   *
   * Used to remove the token query param after a successful login
   */
  private cleanBrowserUrl() {
    window.history.replaceState(
      null,
      '',
      window.location.pathname.replace('/auth', '')
    );
  }

  /**
   * Redirect to the login page on the website
   *
   * Used for the web app when the user is not authenticated
   */
  private redirectToLogin() {
    window.location.href = `${Config.appAuthURL}?webapp=true`;
  }
}
