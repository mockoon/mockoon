import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, from, Observable, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  mergeMap,
  tap
} from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { ToastsService } from 'src/renderer/app/services/toasts.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private logger = new Logger('[SERVICE][STORAGE]');
  private saving$ = new BehaviorSubject<boolean>(false);

  constructor(private toastsService: ToastsService) {}

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
   * Load data from JSON storage.
   * Handles storage failure.
   *
   * A custom path can be passed to load from a different directory than the storage folder.
   * This is especially useful for loading individual environments.
   * When using `path` put the `key` at `null`.
   *
   * @param key - storage key
   * @param path - storage file full path, key will be ignored
   */
  public loadData<T>(key: string, path?: string): Observable<T> {
    return from(MainAPI.invoke<T>('APP_READ_JSON_DATA', key, path)).pipe(
      catchError((error) => {
        const errorMessage = `Error while loading ${key}`;

        this.logger.error(
          `${errorMessage}: ${error.code || ''} ${error.message || ''}`
        );

        this.toastsService.addToast(
          'error',
          `${errorMessage}. Please restart the application.`
        );

        return EMPTY;
      })
    );
  }

  /**
   * Save data to a file.
   * Switch saving flag during save.
   * Handles storage failure.
   *
   * A custom path can be passed to save in a different directory than the storage folder.
   * This is especially useful for saving individual environments.
   * When using `path` put the `key` at `null`.
   *
   * @param key - storage key
   * @param data - data to save
   * @param path - storage file full path, key will be ignored
   * @returns
   */
  public saveData<T>(
    key: string,
    data: T,
    path?: string,
    storagePrettyPrint?: boolean
  ) {
    return of(true).pipe(
      mergeMap(() =>
        from(
          MainAPI.invoke<T>(
            'APP_WRITE_JSON_DATA',
            key,
            data,
            path,
            storagePrettyPrint
          )
        ).pipe(
          tap(() => {
            this.saving$.next(false);
          }),
          catchError((error) => {
            const errorMessage = `Error while saving ${key}`;

            this.logger.error(
              `${errorMessage}: ${error.code || ''} ${error.message || ''}`
            );

            this.toastsService.addToast(
              'error',
              `${errorMessage}. If the problem persists please restart the application.`
            );

            return EMPTY;
          })
        )
      )
    );
  }
}
