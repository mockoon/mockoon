import { Injectable } from '@angular/core';
import { Environment } from '@mockoon/commons';
import { BehaviorSubject, EMPTY, from, Observable, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  mergeMap,
  tap
} from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { PreMigrationSettings } from 'src/renderer/app/models/settings.model';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { Settings } from 'src/shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class StorageService extends Logger {
  private saving$ = new BehaviorSubject<boolean>(false);

  constructor(protected toastsService: ToastsService) {
    super('[SERVICE][STORAGE]', toastsService);
  }

  /**
   * Saving in progress observable
   */
  public saving(): Observable<boolean> {
    return this.saving$.asObservable().pipe(distinctUntilChanged());
  }

  /**
   * Set saving in progress to true
   */
  public initiateSaving() {
    this.saving$.next(true);
  }

  /**
   * Load environment's data from JSON storage.
   * Handles storage failure.
   *
   * @param path - storage file full path
   */
  public loadEnvironment(path: string): Observable<Environment> {
    return from(MainAPI.invoke('APP_READ_ENVIRONMENT_DATA', path)).pipe(
      catchError((error) => {
        this.logMessage('error', 'STORAGE_LOAD_ERROR', { path, error });

        return EMPTY;
      })
    );
  }

  /**
   * Save environments data to a file.
   * Switch saving flag during save.
   * Handles storage failure.
   *
   * @param data - data to save
   * @param path - storage file full path
   * @returns
   */
  public saveEnvironment(
    data: Environment,
    path: string,
    storagePrettyPrint?: boolean
  ) {
    return of(true).pipe(
      mergeMap(() =>
        from(
          MainAPI.invoke(
            'APP_WRITE_ENVIRONMENT_DATA',
            data,
            path,
            storagePrettyPrint
          )
        ).pipe(
          catchError((error) => {
            this.logMessage('error', 'STORAGE_SAVE_ERROR', { path, error });

            return EMPTY;
          }),
          tap(() => {
            this.saving$.next(false);
          })
        )
      )
    );
  }

  /**
   * Load the settings from JSON storage.
   * Handles storage failure.
   *
   */
  public loadSettings(): Observable<PreMigrationSettings> {
    return from(MainAPI.invoke('APP_READ_SETTINGS_DATA')).pipe(
      catchError((error) => {
        this.logMessage('error', 'STORAGE_LOAD_ERROR', {
          path: 'settings',
          error
        });

        return EMPTY;
      })
    );
  }

  /**
   * Save the settings to the settings.json file.
   * Switch saving flag during save.
   * Handles storage failure.
   *
   * @param data - settings to save
   * @returns
   */
  public saveSettings(data: Settings, storagePrettyPrint?: boolean) {
    return of(true).pipe(
      mergeMap(() =>
        from(
          MainAPI.invoke('APP_WRITE_SETTINGS_DATA', data, storagePrettyPrint)
        ).pipe(
          catchError((error) => {
            this.logMessage('error', 'STORAGE_SAVE_ERROR', {
              path: 'settings',
              error
            });

            return EMPTY;
          }),
          tap(() => {
            this.saving$.next(false);
          })
        )
      )
    );
  }
}
