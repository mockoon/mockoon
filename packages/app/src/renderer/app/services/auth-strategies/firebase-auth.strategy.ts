import { inject, Injectable } from '@angular/core';
import {
  Auth,
  User as FirebaseUser,
  getAuth,
  onIdTokenChanged,
  reload,
  signInWithCustomToken
} from 'firebase/auth';
import {
  catchError,
  EMPTY,
  from,
  Observable,
  of,
  switchMap,
  throwError
} from 'rxjs';
import {
  AuthState,
  AuthStrategy
} from 'src/renderer/app/services/auth-strategies/auth-strategy.interface';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Config } from 'src/renderer/config';

/**
 * Website redirects with an auth token, used to authenticate the user in the app
 * using firebase library and authWithCustomToken method.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseAuthStrategy implements AuthStrategy {
  private uiService = inject(UIService);
  private mainApiService = inject(MainApiService);
  private auth: Auth = getAuth();
  private authState$ = new Observable<FirebaseUser | null>((subscriber) => {
    const unsubscribe = onIdTokenChanged(
      this.auth,
      subscriber.next.bind(subscriber),
      subscriber.error.bind(subscriber),
      subscriber.complete.bind(subscriber)
    );

    return { unsubscribe };
  });

  public observeAuthState(): Observable<AuthState> {
    return this.authState$;
  }

  public reloadUser() {
    if (this.auth?.currentUser) {
      return from(reload(this.auth.currentUser));
    }

    return EMPTY;
  }

  public authWithToken(token: string) {
    return from(signInWithCustomToken(this.auth, token)).pipe(
      catchError((error) => {
        if (error?.code === 'auth/network-request-failed') {
          return from(this.auth.signOut()).pipe(
            catchError(() => of(null)),
            switchMap(() => throwError(() => error))
          );
        }

        return throwError(() => error);
      })
    );
  }

  public getToken(force = false): Observable<string | null> {
    if (this.auth?.currentUser) {
      return from(this.auth.currentUser.getIdToken(force)).pipe(
        catchError(() => of(null))
      );
    }

    return of(null);
  }

  public startLoginFlow() {
    if (Config.isWeb) {
      window.location.href = `${Config.loginURL}?appRedirect=${encodeURIComponent(this.buildWebAppRedirectURL())}`;
    } else {
      this.uiService.openModal('auth');
      this.mainApiService.send('APP_AUTH');
    }
  }

  private buildWebAppRedirectURL() {
    const url = new URL(window.location.href);

    url.searchParams.delete('token');

    return url.toString();
  }

  public logout() {
    return from(this.auth.signOut());
  }
}
