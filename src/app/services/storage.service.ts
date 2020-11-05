import { Injectable } from '@angular/core';
import {
  DataOptions,
  get as storageGet,
  set as storageSet
} from 'electron-json-storage';
import {
  BehaviorSubject,
  bindNodeCallback,
  EMPTY,
  Observable,
  throwError
} from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  tap
} from 'rxjs/operators';
import { Logger } from 'src/app/classes/logger';
import { ToastsService } from 'src/app/services/toasts.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private logger = new Logger('[SERVICE][STORAGE]');
  private storageSet$ = bindNodeCallback(
    (
      key: string,
      json: object,
      options: DataOptions,
      callback: (error: any) => void
    ) => storageSet(key, json, options, callback)
  );
  private storageGet$ = bindNodeCallback<string, any>(storageGet);
  private saving$ = new BehaviorSubject<boolean>(false);

  constructor(private toastsService: ToastsService) {}

  /**
   * Saving in progress observable
   */
  public saving(): Observable<boolean> {
    return this.saving$.asObservable().pipe(distinctUntilChanged());
  }

  /**
   * Saving in progress observable value
   */
  public isSaving(): boolean {
    return this.saving$.value;
  }

  /**
   * Load data from JSON storage.
   * Handles storage failure.
   *
   * @param key
   */
  public loadData<T>(key: string): Observable<T> {
    return this.storageGet$(key).pipe(
      catchError((error) => {
        const errorMessage = `Error while loading ${key}`;

        this.logger.error(
          `${errorMessage}: ${error.code || ''} ${error.message || ''}`
        );

        this.toastsService.addToast(
          'error',
          `${errorMessage}. Please restart the application.`
        );

        return throwError(errorMessage);
      })
    );
  }

  /**
   * Save date from a source using JSON storage.
   * Wait for the data to be saved before triggering a new save.
   * Handles storage failure.
   *
   * @param source
   * @param key
   * @param interval
   */
  public saveData<T extends object>(
    source: Observable<T>,
    key: string,
    interval: number
  ): Observable<void> {
    return source.pipe(
      distinctUntilChanged(),
      tap(() => {
        this.saving$.next(true);
      }),
      debounceTime(interval),
      concatMap((data) =>
        this.storageSet$(key, data, null).pipe(
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
          }),
          tap(() => {
            this.saving$.next(false);
          })
        )
      )
    );
  }
}
