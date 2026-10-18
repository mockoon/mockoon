import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Environment } from '@mockoon/commons';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
import { EnvironmentSourceService } from 'src/renderer/app/services/environment-source.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-refresh-modal',
  templateUrl: './environment-refresh-modal.component.html',
  imports: [AsyncPipe]
})
export class EnvironmentRefreshModalComponent {
  private uiService = inject(UIService);
  private store = inject(Store);
  private environmentSourceService = inject(EnvironmentSourceService);

  public environment$: Observable<Environment> = combineLatest([
    this.uiService.getModalPayload$('environmentRefresh'),
    this.store.select('environments')
  ]).pipe(
    map(([environmentUuid, environments]) =>
      environments.find((environment) => environment.uuid === environmentUuid)
    )
  );

  public exportAndRefresh(environmentUuid: string) {
    this.uiService.closeModal('environmentRefresh');
    this.environmentSourceService
      .exportEnvironmentForSource(environmentUuid)
      .pipe(
        switchMap(() =>
          this.environmentSourceService.refreshEnvironmentFromURL(
            environmentUuid
          )
        )
      )
      .subscribe();
  }

  public overwrite(environmentUuid: string) {
    this.uiService.closeModal('environmentRefresh');
    this.environmentSourceService
      .refreshEnvironmentFromURL(environmentUuid)
      .subscribe();
  }

  public close() {
    this.uiService.closeModal('environmentRefresh');
  }
}
