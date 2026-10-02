import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SyncDisconnectReasons, SyncErrors } from '@mockoon/cloud';
import {
  Observable,
  auditTime,
  combineLatest,
  delay,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap
} from 'rxjs';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-no-environment',
  templateUrl: './no-environment.component.html',
  styleUrls: ['./no-environment.component.scss'],
  imports: [AsyncPipe, SvgComponent]
})
export class NoEnvironmentComponent {
  private environmentsService = inject(EnvironmentsService);
  private uiService = inject(UIService);
  private store = inject(Store);
  private userService = inject(UserService);

  public isWeb = Config.isWeb;
  public proPlansURL = Config.proPlansURL;
  public user$ = this.store.select('user');
  public sync$ = this.store.select('sync');
  public isQuotaReached$: Observable<boolean> =
    this.store.selectIsQuotaReached();
  public isOfflineOrQuotaReached$: Observable<boolean> = combineLatest([
    this.sync$.pipe(map((sync) => !sync?.status)),
    this.store.selectIsQuotaReached()
  ]).pipe(map(([isOffline, isQuotaReached]) => isOffline || isQuotaReached));
  public displayCloudOfflineAlert$: Observable<boolean> = combineLatest([
    this.store.selectIsCloudEditable(),
    this.store.select('sync').pipe(
      map((sync) => sync?.lastDisconnectedAt),
      distinctUntilChanged()
    )
  ]).pipe(
    auditTime(0),
    switchMap(([isCloudEditable, lastDisconnectedAt]) => {
      if (isCloudEditable) {
        return of(false);
      }
      if (lastDisconnectedAt === null) {
        return of(true).pipe(delay(6000));
      }

      const elapsed = Date.now() - lastDisconnectedAt;

      if (elapsed >= 6000) {
        return of(true);
      }

      return of(true).pipe(delay(6000 - elapsed));
    }),
    startWith(false)
  );
  public cloudEnvironmentsCount$: Observable<number> = this.store
    .select('settings')
    .pipe(
      map(
        (settings) =>
          settings?.environments?.filter((env) => env.cloud)?.length ?? 0
      )
    );

  public offlineReasonsLabels = {
    [SyncErrors.TOO_MANY_DEVICES]: 'too many devices connected.',
    [SyncErrors.VERSION_TOO_OLD]:
      'your Mockoon version is too old, please update.',
    [SyncDisconnectReasons.ROOM_INCOMPATIBLE_VERSION]:
      'your sync space was updated and is not compatible with your current version of Mockoon, please update.',
    [SyncDisconnectReasons.LICENSE_EXPIRED]:
      'your Mockoon Pro license has expired.'
  };

  public addLocalEnvironment() {
    this.environmentsService.addEnvironment({ setActive: true }).subscribe();
  }

  public openLocalEnvironment(path?: string) {
    this.environmentsService.openEnvironment(path).subscribe();
  }

  public newLocalEnvironmentOpenApi() {
    this.uiService.openModal('openApiImport', {
      mode: 'import',
      cloud: false
    });
  }

  public addCloudEnvironment() {
    this.environmentsService.addCloudEnvironment(null, true).subscribe();
  }

  public addCloudEnvironmentFromLocalFile() {
    this.environmentsService.addCloudEnvironmentFromLocalFile().subscribe();
  }

  public newCloudEnvironmentOpenApi() {
    this.uiService.openModal('openApiImport', {
      mode: 'import',
      cloud: true
    });
  }

  public login(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
    }

    this.userService.startLoginFlow();
  }
}
