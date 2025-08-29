import { Injectable } from '@angular/core';
import { OpenDialogOptions } from 'electron';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { updateSettingsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({
  providedIn: 'root'
})
export class DialogsService {
  private filters = {
    openapi: [{ name: 'OpenAPI v2/v3', extensions: ['yml', 'yaml', 'json'] }],
    json: [{ name: 'JSON', extensions: ['json'] }]
  };

  constructor(
    private store: Store,
    private mainApiService: MainApiService
  ) {}

  /**
   * Show the save dialog and return the path or null if cancelled
   *
   * @param title The dialog title
   * @param saveWorkingDir Whether to save the directory of the selected path as the last used directory in settings
   * @param filter The filter to use for the dialog (default: json)
   * @param defaultPath An optional default path to open the dialog in
   * @returns An observable that emits the selected file path or null if cancelled
   */
  public showSaveDialog(
    title: string,
    saveWorkingDir = true,
    filter: keyof typeof this.filters = 'json',
    defaultPath?: string
  ): Observable<string | null> {
    return from(
      this.mainApiService.invoke('APP_SHOW_SAVE_DIALOG', {
        filters: this.filters[filter],
        title,
        defaultPath
      })
    ).pipe(
      // Get the directory
      switchMap((dialogResult) => {
        if (dialogResult.canceled) {
          return of(null);
        }

        return from(
          this.mainApiService.invoke('APP_GET_BASE_PATH', dialogResult.filePath)
        ).pipe(
          tap((directory) => {
            if (saveWorkingDir) {
              this.store.update(
                updateSettingsAction({ dialogWorkingDir: directory })
              );
            }
          }),
          switchMap(() =>
            // force json extension if json filter is used
            filter === 'json'
              ? from(
                  this.mainApiService.invoke(
                    'APP_REPLACE_FILEPATH_EXTENSION',
                    dialogResult.filePath
                  )
                )
              : of(dialogResult.filePath)
          )
        );
      })
    );
  }

  /**
   * Show the open dialog and return the path or null if cancelled
   */
  public showOpenDialog(
    title: string,
    filterName?: 'json' | 'openapi',
    saveWorkingDir = true,
    multiple = false
  ): Observable<string[] | null> {
    const options: OpenDialogOptions = { title, properties: ['openFile'] };

    if (filterName) {
      options.filters = this.filters[filterName];
    }

    if (multiple) {
      options.properties.push('multiSelections');
    }

    return from(
      this.mainApiService.invoke('APP_SHOW_OPEN_DIALOG', options)
    ).pipe(
      switchMap((dialogResult) => {
        if (dialogResult.canceled || !dialogResult.filePaths?.[0]) {
          return of(null);
        }

        // Get the directory
        return from(
          this.mainApiService.invoke(
            'APP_GET_BASE_PATH',
            dialogResult.filePaths[0]
          )
        ).pipe(
          tap((directory) => {
            if (saveWorkingDir) {
              this.store.update(
                updateSettingsAction({ dialogWorkingDir: directory })
              );
            }
          }),
          map(() => dialogResult.filePaths)
        );
      })
    );
  }
}
