import { Injectable } from '@angular/core';
import {
  fetchAndActivate,
  getValueChanges,
  RemoteConfig
} from '@angular/fire/remote-config';
import { from, Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { RemoteConfigData } from 'src/renderer/app/models/remote-config.model';
import { environment } from 'src/renderer/environments/environment';

@Injectable({ providedIn: 'root' })
export class RemoteConfigService {
  private cache$: Observable<RemoteConfigData>;

  constructor(private firebaseRemoteConfig: RemoteConfig) {}

  /**
   * Get a remote config specific property
   *
   * @param path
   */
  public get<T extends keyof RemoteConfigData>(
    path: T
  ): Observable<RemoteConfigData[T]> {
    return this.getConfig().pipe(map((remoteConfig) => remoteConfig?.[path]));
  }

  /**
   * Handles caching the observable declaration and sharing the subscription.
   * It will only call the remote config API once and share the subscription.
   */
  private getConfig() {
    if (!this.cache$) {
      this.cache$ = this.fetchConfig().pipe(shareReplay(1));
    }

    return this.cache$;
  }

  /**
   * Fetch the remote config, filter per environment, convert to object
   */
  private fetchConfig(): Observable<any> {
    return from(fetchAndActivate(this.firebaseRemoteConfig)).pipe(
      switchMap(() =>
        getValueChanges(this.firebaseRemoteConfig, environment.remoteConfig)
      ),
      map((config) => JSON.parse(config.asString()))
    );
  }
}
