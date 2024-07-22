import { Injectable } from '@angular/core';
import { OpenDialogOptions, SaveDialogOptions } from 'electron';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { updateSettingsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({
  providedIn: 'root'
})
export class DialogsService {
  private filters = {
    openapi: [
      {
        name: 'OpenAPI v2/v3',
        extensions: ['yml', 'yaml', 'json'],
        defaultExtension: 'json'
      }
    ],
    json: [{ name: 'JSON', extensions: ['json'], defaultExtension: 'json' }],
    har: [{ name: 'HAR', extensions: ['har'], defaultExtension: 'har' }]
  };

  constructor(private store: Store) {}

  /**
   * Show the save dialog and return the path or null if cancelled
   */
  public showSaveDialog(
    title: string,
    saveWorkingDir = true,
    defaultPath?: string,
    filterName: 'json' | 'har' = 'json'
  ): Observable<string | null> {
    const filter = this.filters[filterName];
    const options: SaveDialogOptions = {
      filters: filter,
      title,
      defaultPath
    };

    return from(MainAPI.invoke('APP_SHOW_SAVE_DIALOG', options)).pipe(
      // Get the directory
      switchMap((dialogResult) => {
        if (dialogResult.canceled) {
          return of(null);
        }

        return from(
          MainAPI.invoke('APP_GET_BASE_PATH', dialogResult.filePath)
        ).pipe(
          tap((directory) => {
            if (saveWorkingDir) {
              this.store.update(
                updateSettingsAction({ dialogWorkingDir: directory })
              );
            }
          }),
          switchMap(() =>
            from(
              MainAPI.invoke(
                'APP_REPLACE_FILEPATH_EXTENSION',
                dialogResult.filePath,
                filter[0].defaultExtension
              )
            )
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

    return from(MainAPI.invoke('APP_SHOW_OPEN_DIALOG', options)).pipe(
      switchMap((dialogResult) => {
        if (
          dialogResult.canceled ||
          !dialogResult.filePaths ||
          !dialogResult.filePaths[0]
        ) {
          return of(null);
        }

        // Get the directory
        return from(
          MainAPI.invoke('APP_GET_BASE_PATH', dialogResult.filePaths[0])
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
