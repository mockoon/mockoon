import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RemoteConfigData } from '@mockoon/cloud';
import { EMPTY, from, Observable } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { UserService } from 'src/renderer/app/services/user.service';
import { updateRemoteConfigAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { environment } from 'src/renderer/environments/environment';

@Injectable({ providedIn: 'root' })
export class RemoteConfigService {
  private httpClient = inject(HttpClient);
  private userService = inject(UserService);
  private store = inject(Store);

  /**
   * Monitor auth state and update the store
   */
  public init() {
    return this.userService
      .idTokenChanges()
      .pipe(switchMap(() => this.fetchConfig()));
  }

  /**
   * Fetch the remote config
   */
  public fetchConfig(): Observable<RemoteConfigData> {
    return from(this.userService.getIdToken()).pipe(
      switchMap((token) => {
        const headers = token
          ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
          : undefined;

        return this.httpClient
          .post<RemoteConfigData>(
            `${environment.apiURL}remoteconfig`,
            { version: Config.appVersion },
            {
              headers
            }
          )
          .pipe(catchError(() => EMPTY));
      }),
      tap((config) => {
        this.store.update(updateRemoteConfigAction(config));
      })
    );
  }
}
