import { app, BrowserWindow } from 'electron';
import {
  catchErrors as logCatchErrors,
  error as logError,
  info as logInfo,
  transports as logTransports
} from 'electron-log';
import { join as pathJoin, resolve as pathResolve } from 'path';
import {
  parseProtocolArgs,
  registerProtocol
} from 'src/main/libs/custom-protocol';
import { clearIPCChannels, initIPCListeners } from 'src/main/libs/ipc';
import { initMainWindow, saveOpenUrlArgs } from 'src/main/libs/main-window';
import { ServerInstance } from 'src/main/libs/server-management';
import { checkForUpdate } from 'src/main/libs/update';

declare const isTesting: boolean;
declare const isDev: boolean;

// setting log folder make sense for dev mode and tests only, and portable mode
const setAppAndLogPath = (path: string) => {
  app.setPath('userData', path);

  logTransports.file.resolvePath = () => pathJoin(path, '/logs', 'main.log');
};

// set local data folder when in dev mode or running tests
if (isTesting || isDev) {
  setAppAndLogPath(pathResolve('./tmp'));
}

// set data folder when is portable mode
const portableExecDir = process.env.PORTABLE_EXECUTABLE_DIR;
if (portableExecDir) {
  setAppAndLogPath(pathJoin(portableExecDir, 'mockoon-data'));
}

// set data folder when inside a snap package (default folder get wiped on snap updates)
if (process.platform === 'linux' && process.env.SNAP) {
  app.setPath('userData', pathJoin(process.env.SNAP_USER_COMMON));
  app.setAppLogsPath();
}

// log uncaught errors
logCatchErrors({
  onError: (error: Error) => {
    logError(error);

    return false;
  }
});

let mainWindow: BrowserWindow;

// try getting a lock to ensure only one instance of the application is launched
const appLock = app.requestSingleInstanceLock();

const initApp = () => {
  mainWindow = initMainWindow();
  initIPCListeners(mainWindow);

  if (isDev) {
    // when serving (dev mode) enable hot reloading
    import('src/main/libs/hot-reload').then((hotReloadModule) => {
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
    if (process.platform === 'win32' || process.platform === 'linux') {
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
    ServerInstance.stopAll();

    clearIPCChannels();

    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q (except when running tests)
    if (process.platform !== 'darwin' || isTesting) {
      app.quit();
    }
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();

    // if mainWindow is not ready yet (macos startup), store the url in the custom protocol lib
    if (!mainWindow) {
      saveOpenUrlArgs([url]);
    } else {
      parseProtocolArgs([url], mainWindow);
    }
  });
}
