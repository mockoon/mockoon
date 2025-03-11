import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DeployInstance, Plans } from '@mockoon/cloud';
import {
  EMPTY,
  Observable,
  catchError,
  filter,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';
import { RemoteConfigService } from 'src/renderer/app/services/remote-config.service';
import { UserService } from 'src/renderer/app/services/user.service';
import {
  updateDeployInstancesAction,
  updateEnvironmentStatusAction,
  updateUserAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class DeployService {
  constructor(
    private userService: UserService,
    private store: Store,
    private remoteConfig: RemoteConfigService,
    private httpClient: HttpClient
  ) {}

  public init() {
    return this.userService
      .idTokenChanges()
      .pipe(switchMap(() => this.getInstances()));
  }

  /**
   * Get the list of deploy instances
   *
   * @returns
   */
  public getInstances() {
    return forkJoin([
      this.store.select('user').pipe(
        filter((user) => !!user),
        first()
      ),
      this.userService.getIdToken()
    ]).pipe(
      switchMap(([user, token]) => {
        if (user?.plan !== Plans.FREE) {
          return this.httpClient.get<DeployInstance[]>(
            `${Config.apiURL}deployments`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        }

        return of([]);
      }),
      tap((instances: DeployInstance[]) => {
        this.store.update(updateDeployInstancesAction([...instances]));
      }),
      catchError(() => EMPTY)
    );
  }

  /**
   * Check if a subdomain is available
   *
   * @returns
   */
  public checkSubdomainAvailability(
    subdomain: string,
    environmentUuid?: string
  ) {
    return forkJoin([
      this.userService.getIdToken(),
      this.remoteConfig.get('deployUrl').pipe(
        filter((deployUrl) => !!deployUrl),
        first()
      )
    ]).pipe(
      switchMap(([token, deployUrl]) =>
        this.httpClient
          .post(
            `${deployUrl}/deployments/subdomain`,
            {
              subdomain,
              environmentUuid
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
          .pipe(
            map(() => true),
            catchError(() => of(false))
          )
      )
    );
  }
  /**
   * Deploy an environment to the cloud
   *
   * @returns
   */
  public deploy(
    environmentUuid: string,
    options: Pick<DeployInstance, 'visibility' | 'subdomain'>,
    redeploy = false
  ) {
    const environment = this.store.getEnvironmentByUUID(environmentUuid);
    const instances = this.store.get('deployInstances');

    return forkJoin([
      this.userService.getIdToken(),
      this.remoteConfig.get('deployUrl').pipe(
        filter((deployUrl) => !!deployUrl),
        first()
      )
    ]).pipe(
      switchMap(([token, deployUrl]) => {
        const user = this.store.get('user');

        if (
          user &&
          user.plan !== Plans.FREE &&
          // can deploy if the user has not reached the quota or if the environment is already deployed (redeploy)
          (user.deployInstancesQuotaUsed < user.deployInstancesQuota ||
            !!instances.find(
              (instance) => instance.environmentUuid === environmentUuid
            ))
        ) {
          return this.httpClient.post<DeployInstance>(
            `${deployUrl}/deployments`,
            {
              environment,
              ...options,
              version: Config.appVersion
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        }

        return EMPTY;
      }),
      tap((instance) => {
        if (redeploy) {
          this.store.update(
            updateDeployInstancesAction([
              ...this.store.get('deployInstances').map((oldInstance) => {
                if (oldInstance.environmentUuid === environmentUuid) {
                  return { ...oldInstance, ...instance };
                }

                return oldInstance;
              })
            ])
          );
        } else {
          this.store.update(
            updateDeployInstancesAction([
              instance,
              ...this.store.get('deployInstances')
            ])
          );

          this.store.update(
            updateEnvironmentStatusAction(
              {
                needRestart: false,
                redeploying: false
              },
              environmentUuid
            )
          );

          this.store.update(
            updateUserAction({
              deployInstancesQuotaUsed:
                this.store.get('user').deployInstancesQuotaUsed + 1
            })
          );
        }
      })
    );
  }

  /**
   * Do a quick redeploy of an instance based on its previous configuration
   *
   * @param environmentUuid
   * @returns
   */
  public quickRedeploy(environmentUuid: string): Observable<DeployInstance> {
    this.store.update(
      updateEnvironmentStatusAction({ redeploying: true }, environmentUuid)
    );
    const instances = this.store.get('deployInstances');
    const existingInstance = instances.find(
      (instance) => instance.environmentUuid === environmentUuid
    );

    if (!existingInstance) {
      return EMPTY;
    }

    return this.deploy(
      environmentUuid,
      {
        subdomain: existingInstance.subdomain,
        visibility: existingInstance.visibility
      },
      true
    ).pipe(tap());
  }

  /**
   * Stop an instance
   *
   * @returns
   */
  public stop(environmentUuid: string) {
    return forkJoin([
      this.userService.getIdToken(),
      this.remoteConfig.get('deployUrl').pipe(
        filter((deployUrl) => !!deployUrl),
        first()
      )
    ]).pipe(
      switchMap(([token, deployUrl]) => {
        return this.httpClient.delete<DeployInstance>(
          `${deployUrl}/deployments/${environmentUuid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }),
      tap(() => {
        this.store.update(
          updateDeployInstancesAction([
            ...this.store
              .get('deployInstances')
              .filter(
                (instance) => instance.environmentUuid !== environmentUuid
              )
          ])
        );

        this.store.update(
          updateEnvironmentStatusAction(
            { running: false, needRestart: false, redeploying: false },
            environmentUuid
          )
        );

        this.store.update(
          updateUserAction({
            deployInstancesQuotaUsed:
              this.store.get('user').deployInstancesQuotaUsed - 1
          })
        );
      })
    );
  }
}
