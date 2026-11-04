import { FSWatcher, watch } from 'chokidar';
import { statSync } from 'fs';
import { resolve } from 'path';
import { Config } from 'src/main/config';
import { logInfo } from 'src/main/libs/logs';
import { getMainWindow } from 'src/main/libs/main-window';
import { getSettings } from 'src/main/libs/settings';
import { FileWatcherOptions } from 'src/shared/models/settings.model';

let watchers: { UUID: string; watcher: FSWatcher }[] = [];
const reWatchTimeouts: Record<string, NodeJS.Timeout> = {};
const logPrefix = '[MAIN][WATCHER] ';

const getMtime = (filePath: string) => {
  try {
    return statSync(filePath).mtimeMs;
  } catch (_error) {
    return null;
  }
};

const findExistingWatcher = (UUID: string) =>
  watchers.findIndex((watcher) => watcher.UUID === UUID);

const clearScheduledWatcher = (UUID: string) => {
  if (reWatchTimeouts[UUID]) {
    clearTimeout(reWatchTimeouts[UUID]);
    delete reWatchTimeouts[UUID];
  }
};

const clearAllScheduledWatchers = () => {
  Object.keys(reWatchTimeouts).forEach((UUID) => {
    clearTimeout(reWatchTimeouts[UUID]);
    delete reWatchTimeouts[UUID];
  });
};

/**
 * Watch an environment file (after a delay) and notify renderer of any change
 *
 * @param filePath
 */
export const watchEnvironmentFile = (UUID: string, filePath: string) => {
  if (getSettings()?.fileWatcherEnabled === FileWatcherOptions.DISABLED) {
    return;
  }

  // remove any previously scheduled watcher
  clearScheduledWatcher(UUID);

  if (findExistingWatcher(UUID) === -1) {
    // watching is (re)started right after the app saved the file: keep its mtime
    // to detect external changes happening before the watcher is ready
    const lastKnownMtime = getMtime(filePath);

    const watchTimeout = setTimeout(() => {
      logInfo(`${logPrefix}Start watching environment`, {
        environmentUUID: UUID,
        environmentPath: filePath
      });

      const notifyExternalChange = () => {
        logInfo(
          `${logPrefix}Environment was modified externally, notifying renderer process`,
          {
            environmentUUID: UUID,
            environmentPath: filePath
          }
        );

        getMainWindow().webContents.send(
          'APP_FILE_EXTERNAL_CHANGE',
          UUID,
          filePath
        );
      };

      const watcher = watch(resolve(filePath), { atomic: true })
        .on('change', notifyExternalChange)
        .on('ready', () => {
          // file was modified while it was not watched
          if (getMtime(filePath) !== lastKnownMtime) {
            notifyExternalChange();
          }
        });

      watchers.push({ UUID, watcher });
    }, Config.fileReWatchDelay);

    reWatchTimeouts[UUID] = watchTimeout;
  }
};

/**
 * Unwatch an environment file (mainly used before triggering a save and after closing a file)
 *
 * @param UUID
 */
export const unwatchEnvironmentFile = async (UUID: string) => {
  clearScheduledWatcher(UUID);

  const existingWatcherIndex = findExistingWatcher(UUID);

  if (existingWatcherIndex >= 0) {
    logInfo(`${logPrefix}Stop watching environment`, {
      environmentUUID: UUID
    });

    await watchers[existingWatcherIndex].watcher.close();
    watchers.splice(existingWatcherIndex, 1);
  }
};

/**
 * Unwatch all environment files and remove all scheduled re-watch
 *
 */
export const unwatchAllEnvironmentFiles = async () => {
  clearAllScheduledWatchers();

  for (const watcherItem of watchers) {
    logInfo(`${logPrefix}Stop watching environment`, {
      environmentUUID: watcherItem.UUID
    });

    await watcherItem.watcher.close();
  }

  watchers = [];
};
