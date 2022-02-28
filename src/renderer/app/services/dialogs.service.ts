import { Injectable } from '@angular/core';
import { OpenDialogOptions } from 'electron';
import { MainAPI } from 'src/renderer/app/constants/common.constants';

@Injectable({
  providedIn: 'root'
})
export class DialogsService {
  private filters = {
    openapi: [{ name: 'OpenAPI v2/v3', extensions: ['yaml', 'json'] }],
    json: [{ name: 'JSON', extensions: ['json'] }]
  };

  /**
   * Show the save dialog and return the path or null if cancelled
   */
  public async showSaveDialog(title: string): Promise<string | null> {
    const dialogResult = await MainAPI.invoke('APP_SHOW_SAVE_DIALOG', {
      filters: this.filters.json,
      title
    });

    if (dialogResult.canceled) {
      return null;
    }

    // add json ext if was omitted. Required for unix where, despite the filter, a non json ext can be provided. (settings would be saved with erroneous ext, while electron-json-storage would save with json ext, resulting in some non working features, like file watching)
    return await MainAPI.invoke(
      'APP_REPLACE_FILEPATH_EXTENSION',
      dialogResult.filePath
    );
  }

  /**
   * Show the open dialog and return the path or null if cancelled
   */
  public async showOpenDialog(
    title: string,
    filterName?: 'json' | 'openapi'
  ): Promise<string | null> {
    const options: OpenDialogOptions = { title };

    if (filterName) {
      options.filters = this.filters[filterName];
    }

    const dialogResult = await MainAPI.invoke('APP_SHOW_OPEN_DIALOG', options);

    if (
      dialogResult.canceled ||
      !dialogResult.filePaths ||
      !dialogResult.filePaths[0]
    ) {
      return null;
    }

    return dialogResult.filePaths[0];
  }
}
