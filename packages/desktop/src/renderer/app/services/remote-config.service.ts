import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map, mergeMap, tap } from 'rxjs/operators';
import { RemoteConfigData } from 'src/renderer/app/models/remote-config.model';
import { UserService } from 'src/renderer/app/services/user.service';
import { Config } from 'src/renderer/config';
import { environment } from 'src/renderer/environments/environment';

@Injectable({ providedIn: 'root' })
export class RemoteConfigService {
  private remoteConfig$ = new BehaviorSubject<RemoteConfigData>(null);

  constructor(
    private httpClient: HttpClient,
    private userService: UserService
  ) {}

  /**
   * Get a remote config specific property
   *
   * @param path
   */
  public get<T extends keyof RemoteConfigData>(
    path: T
  ): Observable<RemoteConfigData[T]> {
    return this.remoteConfig$.asObservable().pipe(
      map((remoteConfig) => remoteConfig?.[path]),
      distinctUntilChanged()
    );
  }

  /**
   * Monitor auth state and update the store
   */
  public init() {
    return this.userService.idTokenChanges().pipe(
      mergeMap((token) => this.fetchConfig(token)),
      tap((config) => {
        this.remoteConfig$.next(config);
      })
    );
  }

  /**
   * Fetch the remote config
   */
  private fetchConfig(token: string): Observable<RemoteConfigData> {
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : undefined;

    return this.httpClient.post<RemoteConfigData>(
      `${environment.apiURL}remoteconfig`,
      { version: Config.appVersion },
      {
        headers
      }
    );
  }
}
