import { app, BrowserWindow } from 'electron';
import {
  parseProtocolArgs,
  registerProtocol
} from 'src/main/libs/custom-protocol';
import { clearIPCChannels, initIPCListeners } from 'src/main/libs/ipc';
import { createMainLogger, logInfo } from 'src/main/libs/logs';
import { initMainWindow, saveOpenUrlArgs } from 'src/main/libs/main-window';
import { setPaths } from 'src/main/libs/paths';
import { ServerInstance } from 'src/main/libs/server-management';

declare const IS_TESTING: boolean;
declare const IS_DEV: boolean;

setPaths();
createMainLogger();

let mainWindow: BrowserWindow;
let isQuitting = false;

// try getting a lock to ensure only one instance of the application is launched
let appLock = app.requestSingleInstanceLock();

if (IS_DEV) {
  // when serving (dev mode) disable the lock to enable launching multiple instances
  appLock = true;
}

const initApp = (showSplash = true) => {
  mainWindow = initMainWindow(showSplash);
  initIPCListeners(mainWindow);

  if (IS_DEV) {
    // when serving (dev mode) enable hot reloading
    import('src/main/libs/hot-reload').then((hotReloadModule) => {
      hotReloadModule.hotReload();
    });
  }
};

if (!appLock) {
  logInfo(
    '[MAIN] An instance of the application is already running. Stopping process.'
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

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        initApp(false);
      }
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    ServerInstance.stopAll();

    clearIPCChannels();

    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q (except when running tests)
    if (isQuitting || process.platform !== 'darwin' || IS_TESTING) {
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
