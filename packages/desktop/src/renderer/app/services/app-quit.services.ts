import { Injectable } from '@angular/core';
import { combineLatest, fromEvent, race, timer } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { updateUIStateAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { environment } from 'src/renderer/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppQuitService {
  private closing = false;

  constructor(
    private store: Store,
    private storageService: StorageService,
    private telemetryService: TelemetryService
  ) {}

  /**
   * On beforeunload event:
   * - prevent close
   * - display "shutting down" indicator in UI
   * - wait for save to finish
   * - wait for session to close
   * - send QUIT message to IPC main process
   *
   * In any case if something goes wrong in the telemetry or storage, app quit after 10 s
   *
   * @returns
   */
  public init() {
    return fromEvent(window, 'beforeunload').pipe(
      map((event: BeforeUnloadEvent) => {
        event.returnValue = '';
      }),
      filter(() => !this.closing),
      tap(() => {
        this.closing = true;

        this.store.update(updateUIStateAction({ closing: true }));
        MainAPI.send('APP_HIDE_WINDOW');

        this.telemetryService.closeSession();
      }),
      switchMap(() => {
        const waitFor = [
          this.storageService.saving().pipe(filter((saving) => !saving))
        ];

        if (!environment.ci) {
          waitFor.push(
            this.telemetryService
              .sessionInProgress()
              .pipe(filter((sessionInProgress) => !sessionInProgress))
          );
        }

        return race(
          // ensure that app closes after 5s even if something fail on the telemetry or storage side
          timer(5000),
          combineLatest(waitFor)
        );
      }),
      tap(() => {
        MainAPI.send('APP_QUIT');
      })
    );
  }
}
