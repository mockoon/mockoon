import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Workspace } from '@mockoon/cloud';
import {
  EMPTY,
  catchError,
  filter,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { updateWorkspacesAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Service()
export class WorkspaceService {
  private userService = inject(UserService);
  private settingsService = inject(SettingsService);
  private store = inject(Store);
  private httpClient = inject(HttpClient);

  private lastWorkspacesRefresh = 0;

  public init() {
    return this.userService
      .authStateChanges()
      .pipe(switchMap(() => this.getWorkspaces(true)));
  }

  public getWorkspaces(force = false) {
    const dataRefreshInterval = this.store.getRemoteConfig(
      'dataRefreshInterval'
    );
    const now = Date.now();

    if (now - this.lastWorkspacesRefresh < dataRefreshInterval && !force) {
      return EMPTY;
    }

    this.lastWorkspacesRefresh = now;

    return forkJoin([
      this.settingsService.selectApiUrl().pipe(first()),
      this.settingsService.selectIsSelfHosted().pipe(first()),
      this.userService.getToken().pipe(filter((token) => !!token))
    ]).pipe(
      switchMap(([apiUrl, isSelfHosted, token]) => {
        if (!isSelfHosted) {
          return of({ workspaces: [] as Workspace[], isSelfHosted });
        }

        this.store.update(updateWorkspacesAction([]));

        return this.httpClient
          .get<Workspace[]>(`${apiUrl}workspace-access`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          .pipe(map((workspaces) => ({ workspaces, isSelfHosted })));
      }),
      tap(({ workspaces }) => {
        this.store.update(updateWorkspacesAction(workspaces));

        const workspaceFilterId =
          this.settingsService.getSettings().workspaceFilterId;

        if (
          workspaceFilterId !== null &&
          !workspaces.some(({ id }) => id === workspaceFilterId)
        ) {
          this.settingsService.updateSettings({ workspaceFilterId: null });
        }
      }),
      catchError(() => EMPTY)
    );
  }
}
