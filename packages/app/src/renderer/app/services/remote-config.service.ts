import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { RemoteConfigData } from '@mockoon/cloud';
import { EMPTY, from, Observable } from 'rxjs';
import {
  catchError,
  filter,
  switchMap,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { updateRemoteConfigAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Service()
export class RemoteConfigService {
  private httpClient = inject(HttpClient);
  private userService = inject(UserService);
  private settingsService = inject(SettingsService);
  private store = inject(Store);

  /**
   * Monitor auth state and fetch the remote config
   */
  public init() {
    return this.userService
      .authStateChanges()
      .pipe(switchMap(() => this.fetchConfig()));
  }

  /**
   * Fetch the remote config only if the user is authenticated
   */
  public fetchConfig(): Observable<RemoteConfigData> {
    return from(this.userService.getToken()).pipe(
      filter((token) => !!token),
      withLatestFrom(this.settingsService.selectApiURL()),
      switchMap(([token, apiURL]) => {
        const headers = token
          ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
          : undefined;

        return this.httpClient
          .post<RemoteConfigData>(
            `${apiURL}remoteconfig`,
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
