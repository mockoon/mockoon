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
import { BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron';
import { get as storageGet, set as storageSet } from 'electron-json-storage';
import { error as logError, info as logInfo } from 'electron-log';
import { promises as fsPromises } from 'fs';
import { lookup as mimeTypeLookup } from 'mime-types';
import { promisify } from 'util';
import {
  IPCHandlerChannels,
  IPCListenerChannels
} from '../constants/ipc.constants';
import { toggleExportMenuItems } from './menu';
import { applyUpdate } from './update';

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

  ipcMain.on('APP_DISABLE_EXPORT', () => {
    toggleExportMenuItems(false);
  });

  ipcMain.on('APP_ENABLE_EXPORT', () => {
    toggleExportMenuItems(true);
  });

  ipcMain.on('APP_LOGS', (event, data) => {
    if (data.type === 'info') {
      logInfo(data.message);
    } else if (data.type === 'error') {
      logError(data.message);
    }
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
    async (event, key) => await promisify(storageGet)(key)
  );

  ipcMain.handle(
    'APP_WRITE_JSON_DATA',
    async (event, key, data) => await promisify(storageSet)(key, data)
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

  ipcMain.handle(
    'APP_SHOW_OPEN_DIALOG',
    async (event, options) => await dialog.showOpenDialog(options)
  );

  ipcMain.handle(
    'APP_SHOW_SAVE_DIALOG',
    async (event, options) => await dialog.showSaveDialog(options)
  );

  ipcMain.handle('APP_GET_PLATFORM', (event) => process.platform);

  ipcMain.handle('APP_GET_MIME_TYPE', (event, filePath) =>
    mimeTypeLookup(filePath)
  );

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

  ipcMain.handle('APP_START_SERVER', async (event, environment) => {
    const server = new MockoonServer(environment, {
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
};

/**
 * Remove all listeners and handlers on the IPC main.
 * This is mainly used to clear the listener before reactivating a
 * window on macOS
 */
export const clearIPCChannels = () => {
  IPCListenerChannels.forEach((listener) => {
    ipcMain.removeAllListeners(listener);
  });
  IPCHandlerChannels.forEach((handler) => {
    ipcMain.removeHandler(handler);
  });
};
