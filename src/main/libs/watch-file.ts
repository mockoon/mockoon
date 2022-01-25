import { FSWatcher, watch } from 'chokidar';
import { info as logInfo } from 'electron-log';
import { resolve } from 'path';
import { getMainWindow } from 'src/main/libs/main-window';

const watchers: { UUID: string; filePath: string; watcher: FSWatcher }[] = [];

/**
 * Watch an environment file and notify renderer of any change
 *
 * @param filePath
 */
export const watchEnvironmentFile = (UUID: string, filePath: string) => {
  const watcher = watch(resolve(filePath)).on('change', (event, path) => {
    logInfo(
      `[MAIN][WATCHER] ${filePath}/${UUID} was modified externally. Notifying renderer process.`
    );
    getMainWindow().webContents.send(
      'APP_FILE_EXTERNAL_CHANGE',
      UUID,
      filePath
    );
  });

  watchers.push({ UUID, filePath, watcher });
};

export const unwatchEnvironmentFile = async (filePathOrUUID: string) => {
  const existingWatcherIndex = watchers.findIndex(
    (watcher) =>
      watcher.filePath === filePathOrUUID || watcher.UUID === filePathOrUUID
  );

  if (existingWatcherIndex >= 0) {
    await watchers[existingWatcherIndex].watcher.close();
    watchers.splice(existingWatcherIndex, 1);
  }
};
