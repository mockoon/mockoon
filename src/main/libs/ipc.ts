import {
  dereference as openAPIDereference,
  validate as openAPIValidate
} from '@apidevtools/swagger-parser';
import { Environment, Environments } from '@mockoon/commons';
import {
  MockoonServer,
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
import {
  DataOptions,
  get as storageGet,
  getDataPath,
  set as storageSet
} from 'electron-json-storage';
import { error as logError, info as logInfo } from 'electron-log';
import { promises as fsPromises } from 'fs';
import { createServer } from 'http';
import { lookup as mimeTypeLookup } from 'mime-types';
import { dirname, join as pathJoin, parse as pathParse } from 'path';
import { promisify } from 'util';
import {
  IPCMainHandlerChannels,
  IPCMainListenerChannels
} from '../constants/ipc.constants';
import { migrateData } from './data-migration';
import { toggleEnvironmentMenuItems, toggleRouteMenuItems } from './menu';
import { applyUpdate } from './update';

declare const isTesting: boolean;

const dialogMocks: { [x: string]: string[] } = { save: [], open: [] };

export const initIPCListeners = (
  mainWindow: BrowserWindow,
  runningServerInstances: { [key in string]: MockoonServer }
) => {
  const updatedEnvironments: { [key in string]: Environment } = {};

  // Quit requested by renderer (when waiting for save to finish)
  ipcMain.on('APP_QUIT', () => {
    // destroy the window otherwise app.quit() will trigger beforeunload again. Also there is no app.quit for macos
    mainWindow.destroy();
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
    environments.forEach((environment) => {
      updatedEnvironments[environment.uuid] = environment;
    });
  });

  ipcMain.on('APP_APPLY_UPDATE', () => {
    applyUpdate();
  });

  ipcMain.handle('APP_GET_OS', () => process.platform);

  ipcMain.handle(
    'APP_READ_JSON_DATA',
    async (event, key: string, path?: string) => {
      const options: DataOptions = { dataPath: '' };

      if (path) {
        const parsedPath = pathParse(path);

        key = parsedPath.name;
        options.dataPath = parsedPath.dir;
      }
      try {
        const data = await promisify<string, DataOptions, any>(storageGet)(
          key,
          options
        );

        // if object is empty return null instead (electron json storage returns empty object if file does not exists)
        if (
          !data ||
          (Object.keys(data).length === 0 && data.constructor === Object)
        ) {
          return null;
        }

        return data;
      } catch (error) {
        // if file empty (JSON.parse error), it will throw
        return null;
      }
    }
  );

  ipcMain.handle(
    'APP_WRITE_JSON_DATA',
    async (event, key, data, path?: string, storagePrettyPrint?: boolean) => {
      const options: DataOptions & { prettyPrinting?: boolean } = {
        dataPath: '',
        prettyPrinting: storagePrettyPrint
      };

      if (path) {
        const parsedPath = pathParse(path);

        key = parsedPath.name;
        options.dataPath = parsedPath.dir;
      }

      return await promisify<string, any, DataOptions>(storageSet)(
        key,
        data,
        options
      );
    }
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
    'APP_OPENAPI_DEREFERENCE',
    async (event, filePath) =>
      await openAPIDereference(filePath, {
        dereference: { circular: 'ignore' }
      })
  );

  ipcMain.handle(
    'APP_OPENAPI_VALIDATE',
    async (event, data) => await openAPIValidate(data)
  );

  ipcMain.handle('APP_START_SERVER', (event, environment, environmentPath) => {
    const environmentDirectory = dirname(environmentPath);
    const server = new MockoonServer(environment, {
      environmentDirectory,
      refreshEnvironmentFunction: (environmentUUID) => {
        const updatedEnvironment = updatedEnvironments[environmentUUID];
        if (updatedEnvironment) {
          return updatedEnvironment;
        }

        return null;
      }
    });

    server.once('started', () => {
      runningServerInstances[environment.uuid] = server;

      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        environment.uuid,
        'started'
      );
    });

    server.once('stopped', () => {
      delete runningServerInstances[environment.uuid];

      // verify that window is still present as we stop servers when app quits too
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'APP_SERVER_EVENT',
          environment.uuid,
          'stopped'
        );

        return;
      }
    });

    server.once('creating-proxy', () => {
      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        environment.uuid,
        'creating-proxy'
      );
    });

    server.on('entering-request', () => {
      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        environment.uuid,
        'entering-request'
      );
    });

    server.on('transaction-complete', (transaction) => {
      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        environment.uuid,
        'transaction-complete',
        { transaction }
      );
    });

    server.on('error', (errorCode, originalError) => {
      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        environment.uuid,
        'error',
        {
          errorCode,
          originalError
        }
      );
    });

    server.start();
  });

  ipcMain.handle('APP_STOP_SERVER', async (event, environmentUUID) => {
    if (runningServerInstances[environmentUUID]) {
      runningServerInstances[environmentUUID].stop();
    }
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
