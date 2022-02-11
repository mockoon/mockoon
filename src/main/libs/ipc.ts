import { Environment, Environments } from '@mockoon/commons';
import {
  OpenAPIConverter,
  SetFakerLocale,
  SetFakerSeed
} from '@mockoon/commons-server';
import {
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  shell
} from 'electron';
import { getDataPath } from 'electron-json-storage';
import { error as logError, info as logInfo } from 'electron-log';
import { promises as fsPromises } from 'fs';
import { createServer } from 'http';
import { lookup as mimeTypeLookup } from 'mime-types';
import { join as pathJoin, parse as pathParse } from 'path';
import {
  IPCMainHandlerChannels,
  IPCMainListenerChannels
} from 'src/main/constants/ipc.constants';
import { migrateData } from 'src/main/libs/data-migration';
import {
  toggleEnvironmentMenuItems,
  toggleRouteMenuItems
} from 'src/main/libs/menu';
import { ServerInstance } from 'src/main/libs/server-management';
import { readJSONData, writeJSONData } from 'src/main/libs/storage';
import { applyUpdate } from 'src/main/libs/update';
import {
  unwatchEnvironmentFile,
  watchEnvironmentFile
} from 'src/main/libs/watch-file';

declare const isTesting: boolean;

const dialogMocks: { [x: string]: string[] } = { save: [], open: [] };

export const initIPCListeners = (mainWindow: BrowserWindow) => {
  // Quit requested by renderer (when waiting for save to finish)
  ipcMain.on('APP_QUIT', () => {
    // destroy the window otherwise app.quit() will trigger beforeunload again. Also there is no app.quit for macos
    mainWindow.destroy();
  });

  ipcMain.on('APP_HIDE_WINDOW', () => {
    mainWindow.hide();
  });

  ipcMain.on('APP_DISABLE_ENVIRONMENT_MENU_ENTRIES', () => {
    toggleEnvironmentMenuItems(false);
  });

  ipcMain.on('APP_ENABLE_ENVIRONMENT_MENU_ENTRIES', () => {
    toggleEnvironmentMenuItems(true);
  });

  ipcMain.on('APP_DISABLE_ROUTE_MENU_ENTRIES', () => {
    toggleRouteMenuItems(false);
  });

  ipcMain.on('APP_ENABLE_ROUTE_MENU_ENTRIES', () => {
    toggleRouteMenuItems(true);
  });

  ipcMain.on('APP_LOGS', (event, data) => {
    if (data.type === 'info') {
      logInfo(data.message);
    } else if (data.type === 'error') {
      logError(data.message);
    }
  });

  ipcMain.on('APP_SHOW_FILE', (event, path) => {
    shell.showItemInFolder(path);
  });

  ipcMain.on('APP_OPEN_EXTERNAL_LINK', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.on('APP_SET_FAKER_OPTIONS', (event, data) => {
    SetFakerLocale(data.locale);
    SetFakerSeed(data.seed);
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

  ipcMain.on('APP_WATCH_FILE', (event, uuid, filePath) => {
    watchEnvironmentFile(uuid, filePath);
  });

  ipcMain.handle(
    'APP_UNWATCH_FILE',
    async (event, filePathOrUUID) =>
      await unwatchEnvironmentFile(filePathOrUUID)
  );

  ipcMain.handle('APP_GET_OS', () => process.platform);

  ipcMain.handle(
    'APP_READ_JSON_DATA',
    async (event, path: string) => await readJSONData(path)
  );

  ipcMain.handle(
    'APP_WRITE_JSON_DATA',
    async (event, data, path: string, storagePrettyPrint?: boolean) =>
      await writeJSONData(data, path, storagePrettyPrint)
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

  ipcMain.handle('APP_READ_CLIPBOARD', async (event) =>
    clipboard.readText('clipboard')
  );

  /**
   * This IPC channel must be mocked when running e2e tests
   */
  ipcMain.handle('APP_SHOW_OPEN_DIALOG', async (event, options) => {
    if (isTesting) {
      return { filePaths: [dialogMocks.open.pop()] };
    } else {
      return await dialog.showOpenDialog(mainWindow, options);
    }
  });

  /**
   * This IPC channel must be mocked when running e2e tests
   */
  ipcMain.handle('APP_SHOW_SAVE_DIALOG', async (event, options) => {
    if (isTesting) {
      return { filePath: dialogMocks.save.pop() };
    } else {
      return await dialog.showSaveDialog(mainWindow, options);
    }
  });

  ipcMain.handle('APP_GET_PLATFORM', (event) => process.platform);

  ipcMain.handle('APP_BUILD_STORAGE_FILEPATH', (event, name: string) =>
    pathJoin(getDataPath(), `${name}.json`)
  );

  ipcMain.handle('APP_GET_MIME_TYPE', (event, filePath) =>
    mimeTypeLookup(filePath)
  );

  ipcMain.handle('APP_GET_FILENAME', (event, filePath) => {
    const parsedPath = pathParse(filePath);

    return parsedPath.name;
  });

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

  ipcMain.handle(
    'APP_NEW_STORAGE_MIGRATION',
    async (event) => await migrateData()
  );
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
if (isTesting) {
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
