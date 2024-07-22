import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Auth,
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
  tap,
  throwError
} from 'rxjs';
import {
  updateDeployInstancesAction,
  updateUserAction
} from 'src/renderer/app/stores/actions';
import { Store, storeDefaultState } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class UserService {
  private auth: Auth = inject(Auth);
  private idToken$ = idToken(this.auth);

  constructor(
    private httpClient: HttpClient,
    private store: Store
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

  public logout() {
    return from(this.auth.signOut()).pipe(
      tap(() => {
        this.store.update(
          updateDeployInstancesAction(storeDefaultState.deployInstances)
        );
        this.store.update(updateUserAction(storeDefaultState.user));
      })
    );
  }
}
