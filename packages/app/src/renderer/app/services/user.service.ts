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
  combineLatest,
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
  upateFeedbackAction,
  updateDeployInstancesAction,
  updateUserAction
} from 'src/renderer/app/stores/actions';
import { Store, storeDefaultState } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class UserService {
  private isWeb = Config.isWeb;
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
    if (Config.isWeb) {
      this.uiService.openModal('authIframe');
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
    return combineLatest([
      authState(this.auth),
      this.store.select('settings')
    ]).pipe(
      take(1),
      tap(([user, settings]) => {
        if (!user && settings.welcomeShown) {
          this.uiService.openModal('authIframe');
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

  public sendFeedback(message: string) {
    return from(this.auth.currentUser.getIdToken()).pipe(
      switchMap((token) =>
        this.httpClient.post(
          `${Config.apiURL}user/feedback`,
          { message },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
      ),
      tap(() => {
        this.store.update(upateFeedbackAction(''));

        this.loggerService.logMessage('info', 'FEEDBACK_SEND_SUCCESS');
      }),
      catchError(() => {
        this.loggerService.logMessage('error', 'FEEDBACK_SEND_ERROR');

        return EMPTY;
      })
    );
  }
}
