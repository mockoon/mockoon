import { Injectable } from '@angular/core';
import { AngularFireRemoteConfig, filterFresh, Parameter } from '@angular/fire/remote-config';
import { Observable } from 'rxjs';
import { filter, map, pluck, shareReplay, take } from 'rxjs/operators';
import { RemoteConfig } from 'src/app/models/remote-config.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class RemoteConfigService {
  private cache$: Observable<RemoteConfig>;

  constructor(private remoteConfig: AngularFireRemoteConfig) {}

  /**
   * Get a remote config specific property
   *
   * @param path
   */
  public get<T extends keyof RemoteConfig>(
    path: T
  ): Observable<RemoteConfig[T]> {
    return this.getConfig().pipe(pluck(path));
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
  private fetchConfig(): Observable<RemoteConfig> {
    return this.remoteConfig.changes.pipe(
      filterFresh(43_200_000),
      filter((param: Parameter) => param.key === environment.remoteConfig),
      take(1),
      map(parameter => JSON.parse(parameter.asString()))
    );
  }
}
