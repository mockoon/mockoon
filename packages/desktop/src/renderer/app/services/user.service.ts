import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Auth, signInWithCustomToken, user } from '@angular/fire/auth';
import { catchError, from, of, switchMap, tap, throwError } from 'rxjs';
import { User } from 'src/renderer/app/models/user.model';
import { setUpdateUserAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class UserService {
  private auth: Auth = inject(Auth);
  private authUser$ = user(this.auth);

  constructor(
    private httpClient: HttpClient,
    private store: Store
  ) {}

  /**
   * Monitor auth state and update the store
   */
  public init() {
    return this.authUser$.pipe(
      switchMap((authUser) => {
        if (authUser) {
          return this.getUserInfo();
        }

        return of(null);
      })
    );
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
    return this.getIdToken().pipe(
      switchMap((idToken) =>
        this.httpClient
          .get(`${Config.apiURL}user`, {
            headers: { Authorization: `Bearer ${idToken}` }
          })
          .pipe(
            tap((info: User) =>
              this.store.update(setUpdateUserAction({ ...info }))
            )
          )
      )
    );
  }

  public getIdToken() {
    return from(this.auth.currentUser.getIdToken());
  }

  public logout() {
    return from(this.auth.signOut()).pipe(
      tap(() => this.store.update(setUpdateUserAction(null)))
    );
  }
}
