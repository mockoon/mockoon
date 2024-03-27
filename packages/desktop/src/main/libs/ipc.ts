import { Environment, Environments } from '@mockoon/commons';
import { OpenAPIConverter } from '@mockoon/commons-server';
import { createHash } from 'crypto';
import {
  BrowserWindow,
  Menu,
  clipboard,
  dialog,
  ipcMain,
  shell
} from 'electron';
import { getDataPath } from 'electron-json-storage';
import { promises as fsPromises } from 'fs';
import { createServer } from 'http';
import { lookup as mimeTypeLookup } from 'mime-types';
import {
  format as pathFormat,
  join as pathJoin,
  parse as pathParse
} from 'path';
import {
  IPCMainHandlerChannels,
  IPCMainListenerChannels
} from 'src/main/constants/ipc.constants';
import { logError, logInfo } from 'src/main/libs/logs';
import { updateMenuState } from 'src/main/libs/menu';
import { showFolderInExplorer } from 'src/main/libs/paths';
import { ServerInstance } from 'src/main/libs/server-management';
import {
  getSettings,
  loadSettings,
  saveSettings
} from 'src/main/libs/settings';
import { readJSONData, writeJSONData } from 'src/main/libs/storage';
import { applyUpdate } from 'src/main/libs/update';
import {
  unwatchAllEnvironmentFiles,
  unwatchEnvironmentFile,
  watchEnvironmentFile
} from 'src/main/libs/watch-file';
import {
  handleZoomIn,
  handleZoomOut,
  handleZoomReset
} from 'src/main/libs/zoom';
import { MenuStateUpdatePayload } from 'src/shared/models/ipc.model';
import {
  EnvironmentDescriptor,
  Settings
} from 'src/shared/models/settings.model';

declare const IS_TESTING: boolean;

const dialogMocks: { [x: string]: string[] } = { save: [], open: [] };

/**
 * Returns the user data path or the last saved saved/opened directory
 *
 * @returns
 */
const getDialogDefaultPath = () => {
  const settings = getSettings();

  if (settings.dialogWorkingDir) {
    return settings.dialogWorkingDir;
  }

  return getDataPath();
};

export const initIPCListeners = (mainWindow: BrowserWindow) => {
  // Quit requested by renderer (when waiting for save to finish)
  ipcMain.on('APP_QUIT', () => {
    // destroy the window otherwise app.quit() will trigger beforeunload again. Also there is no app.quit for macos
    mainWindow.destroy();
  });

  ipcMain.on('APP_HIDE_WINDOW', () => {
    mainWindow.hide();
  });

  ipcMain.on(
    'APP_UPDATE_MENU_STATE',
    (event, state: MenuStateUpdatePayload) => {
      updateMenuState(state);
    }
  );

  ipcMain.on('APP_LOGS', (event, data) => {
    if (data.type === 'info') {
      logInfo(data.message, data.payload);
    } else if (data.type === 'error') {
      logError(data.message, data.payload);
    }
  });

  ipcMain.on('APP_SHOW_FILE', (event, path) => {
    shell.showItemInFolder(path);
  });

  ipcMain.on('APP_SHOW_FOLDER', (event, name) => {
    showFolderInExplorer(name);
  });

  ipcMain.on('APP_OPEN_EXTERNAL_LINK', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.on('APP_WRITE_CLIPBOARD', async (event, data) => {
    clipboard.writeText(data, 'clipboard');
  });

  ipcMain.on('APP_UPDATE_ENVIRONMENT', (event, environments: Environments) => {
    ServerInstance.updateEnvironments(environments);
  });

  ipcMain.on('APP_APPLY_UPDATE', () => {
    applyUpdate();
  });

  ipcMain.on('APP_ZOOM', (event, action: 'IN' | 'OUT' | 'RESET') => {
    if (action === 'IN') {
      handleZoomIn(mainWindow);
    } else if (action === 'OUT') {
      handleZoomOut(mainWindow);
    } else if (action === 'RESET') {
      handleZoomReset(mainWindow);
    }
  });

  ipcMain.handle(
    'APP_UNWATCH_FILE',
    async (event, UUID) => await unwatchEnvironmentFile(UUID)
  );

  ipcMain.handle(
    'APP_UNWATCH_ALL_FILE',
    async () => await unwatchAllEnvironmentFiles()
  );

  ipcMain.handle('APP_GET_OS', () => process.platform);

  ipcMain.handle(
    'APP_READ_ENVIRONMENT_DATA',
    async (event, path: string) => await readJSONData(path)
  );

  ipcMain.handle(
    'APP_WRITE_ENVIRONMENT_DATA',
    async (
      event,
      data,
      descriptor: EnvironmentDescriptor,
      storagePrettyPrint?: boolean
    ) => {
      if (!descriptor.cloud) {
        unwatchEnvironmentFile(data.uuid);
      }

      await writeJSONData(data, descriptor.path, storagePrettyPrint);

      if (!descriptor.cloud) {
        watchEnvironmentFile(data.uuid, descriptor.path);
      }
    }
  );

  ipcMain.handle('APP_READ_SETTINGS_DATA', async () => await loadSettings());

  ipcMain.handle(
    'APP_WRITE_SETTINGS_DATA',
    async (event, newSettings: Settings, storagePrettyPrint?: boolean) =>
      await saveSettings(newSettings, storagePrettyPrint)
  );

  ipcMain.handle(
    'APP_READ_FILE',
    async (event, filePath) => await fsPromises.readFile(filePath, 'utf-8')
  );

  ipcMain.handle(
    'APP_WRITE_FILE',
    async (event, filePath, data) =>
      await fsPromises.writeFile(filePath, data, 'utf-8')
  );

  ipcMain.handle('APP_READ_CLIPBOARD', async () =>
    clipboard.readText('clipboard')
  );

  /**
   * This IPC channel must be mocked when running e2e tests
   */
  ipcMain.handle('APP_SHOW_OPEN_DIALOG', async (event, options) => {
    options.defaultPath = getDialogDefaultPath();

    if (IS_TESTING) {
      return { filePaths: [dialogMocks.open.pop()] };
    } else {
      return await dialog.showOpenDialog(mainWindow, options);
    }
  });

  /**
   * This IPC channel must be mocked when running e2e tests
   */
  ipcMain.handle('APP_SHOW_SAVE_DIALOG', async (event, options) => {
    if (!options.defaultPath) {
      options.defaultPath = getDialogDefaultPath();
    }

    if (IS_TESTING) {
      return { filePath: dialogMocks.save.pop() };
    } else {
      return await dialog.showSaveDialog(mainWindow, options);
    }
  });

  ipcMain.handle('APP_GET_PLATFORM', () => process.platform);

  ipcMain.handle('APP_BUILD_STORAGE_FILEPATH', (event, name: string) =>
    pathJoin(getDataPath(), `${name}.json`)
  );

  ipcMain.handle(
    'APP_GET_BASE_PATH',
    (event, filePath: string) => pathParse(filePath).dir
  );

  ipcMain.handle('APP_REPLACE_FILEPATH_EXTENSION', (event, filePath: string) =>
    pathFormat({ ...pathParse(filePath), base: '', ext: '.json' })
  );

  ipcMain.handle('APP_GET_MIME_TYPE', (event, filePath) =>
    mimeTypeLookup(filePath)
  );

  ipcMain.handle('APP_GET_FILENAME', (event, filePath) => {
    const parsedPath = pathParse(filePath);

    return parsedPath.name;
  });

  ipcMain.handle('APP_GET_HASH', (event, str) =>
    createHash('sha1').update(str, 'utf-8').digest('hex')
  );

  ipcMain.handle(
    'APP_OPENAPI_CONVERT_FROM',
    async (event, filePath: string, port?: number) => {
      const openApiConverter = new OpenAPIConverter();

      return await openApiConverter.convertFromOpenAPI(filePath, port);
    }
  );

  ipcMain.handle('APP_OPENAPI_CONVERT_TO', async (event, data: Environment) => {
    const openApiConverter = new OpenAPIConverter();

    return await openApiConverter.convertToOpenAPIV3(data);
  });

  ipcMain.handle(
    'APP_START_SERVER',
    (event, environment: Environment, environmentPath: string) => {
      new ServerInstance(environment, environmentPath);
    }
  );

  ipcMain.handle('APP_STOP_SERVER', (event, environmentUUID: string) => {
    ServerInstance.stop(environmentUUID);
  });
};

/**
 * Remove all listeners and handlers on the IPC main.
 * This is mainly used to clear the listener before reactivating a
 * window on macOS
 */
export const clearIPCChannels = () => {
  IPCMainListenerChannels.forEach((listener) => {
    ipcMain.removeAllListeners(listener);
  });
  IPCMainHandlerChannels.forEach((handler) => {
    ipcMain.removeHandler(handler);
  });
};

/**
 * When running e2e tests and testing native dialogs/menus/clipboard,
 * we open a server to receive the action to mock (we cannot use Webdriver to access Electron's native features).
 * Called URL should be in the following form:
 * - Dialogs: `dialogs#save|open#/path/filename.ext`
 * - Menu items: menu#menu_item_id
 * - Clipboard: clipboard#read
 *
 * (This mock will be striped from the prod build by Webpack)
 */
if (IS_TESTING) {
  createServer((req, res) => {
    const chunks: any[] = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const data = Buffer.concat(chunks).toString();

      const [category, action, filepath] = req.url
        ?.replace('/', '')
        .split('#') as string[];

      if (category === 'menu' && action) {
        Menu.getApplicationMenu()?.getMenuItemById(action)?.click();
      } else if (category === 'clipboard' && action === 'read') {
        res.write(clipboard.readText('clipboard'));
      } else if (category === 'clipboard' && action === 'write') {
        clipboard.writeText(data);
      } else if (category === 'dialogs' && action && filepath) {
        dialogMocks[action].push(filepath);
      }
      res.end();
    });
  }).listen(45123);
}
