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
   * Load data from JSON storage.
   * Handles storage failure.
   *
   * Path can be a file 'key', that will retrieve the corresponding file from the user data storage folder:
   * 'settings' --> /%USER_DATA%/mockoon/storage/settings.json
   *
   * @param path - storage file full path or key
   */
  public loadData<T>(path: string): Observable<T> {
    return from(MainAPI.invoke<T>('APP_READ_JSON_DATA', path)).pipe(
      catchError((error) => {
        this.logMessage('error', 'STORAGE_LOAD_ERROR', { path, error });

        return EMPTY;
      })
    );
  }

  /**
   * Save data to a file.
   * Switch saving flag during save.
   * Handles storage failure.
   *
   * Path can be a file 'key', that will retrieve the corresponding file from the user data storage folder:
   * 'settings' --> /%USER_DATA%/mockoon/storage/settings.json
   *
   * @param data - data to save
   * @param path - storage file full path or key
   * @returns
   */
  public saveData<T>(data: T, path: string, storagePrettyPrint?: boolean) {
    return of(true).pipe(
      mergeMap(() =>
        from(
          MainAPI.invoke<T>(
            'APP_WRITE_JSON_DATA',
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
}
