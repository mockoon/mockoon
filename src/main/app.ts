import { MockoonServer } from '@mockoon/commons-server';
import { app, BrowserWindow } from 'electron';
import {
  catchErrors as logCatchErrors,
  error as logError,
  info as logInfo,
  transports as logTransports
} from 'electron-log';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { parseProtocolArgs, registerProtocol } from './libs/custom-protocol';
import { clearIPCChannels, initIPCListeners } from './libs/ipc';
import { initMainWindow } from './libs/main-window';
import { checkForUpdate } from './libs/update';

declare const isTesting: boolean;
declare const isDev: boolean;

const setAppAndLogPath = (path: string) => {
  app.setPath('userData', path);

  logTransports.file.resolvePath = () => pathJoin(path, '/logs', 'main.log');
};

// set local data folder when in dev mode or running tests
if (isTesting || isDev) {
  setAppAndLogPath(pathResolve('./tmp'));
}

// set local data folder when is portable mode
const portableExecDir = process.env.PORTABLE_EXECUTABLE_DIR;
if (portableExecDir) {
  setAppAndLogPath(pathJoin(portableExecDir, 'mockoon-data'));
}

// log uncaught errors
logCatchErrors({
  onError: (error: Error) => {
    logError(error);

    return false;
  }
});

// running Mockoon server instances
const runningServerInstances: { [key in string]: MockoonServer } = {};
let mainWindow: BrowserWindow;

// try getting a lock to ensure only one instance of the application is launched
const appLock = app.requestSingleInstanceLock();

const initApp = () => {
  mainWindow = initMainWindow();
  initIPCListeners(mainWindow, runningServerInstances);

  if (isDev) {
    // when serving (dev mode) enable hot reloading
    import('./libs/hot-reload').then((hotReloadModule) => {
      hotReloadModule.hotReload();
    });
  }
};

if (!appLock) {
  logInfo(
    '[MAIN]An instance of the application is already running. Stopping process.'
  );
  app.quit();
} else {
  // Someone tried to run a second instance, we should focus our window. Also triggered on windows when a custom protocol is triggered (mockoon://)
  app.on('second-instance', (event, args) => {
    if (process.platform === 'win32') {
      logInfo('second instance args:' + JSON.stringify(args));
      parseProtocolArgs(args, mainWindow);
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    registerProtocol();
    initApp();

    checkForUpdate(mainWindow);

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        initApp();
      }
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // stop running servers before closing
    Object.keys(runningServerInstances).forEach((runningEnvironmentUUID) => {
      logInfo(
        `[SERVICE][SERVER]Server ${runningEnvironmentUUID} has been stopped`
      );
      runningServerInstances[runningEnvironmentUUID].stop();
    });

    clearIPCChannels();

    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q (except when running tests)
    if (process.platform !== 'darwin' || isTesting) {
      app.quit();
    }
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    logInfo('open Url args: ' + url);
    parseProtocolArgs([url], mainWindow);
  });
}
