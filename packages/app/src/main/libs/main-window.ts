import { BrowserWindow, Menu, shell } from 'electron';
import * as windowState from 'electron-window-state';
import { join as pathJoin } from 'path';
import { argv } from 'process';
import { parseProtocolArgs } from 'src/main/libs/custom-protocol';
import { createMenu } from 'src/main/libs/menu';
import { getRuntimeArg } from 'src/main/libs/runtime-args';
import { createSplashScreen } from 'src/main/libs/splashscreen';
import { checkForUpdate } from 'src/main/libs/update';

declare const IS_TESTING: boolean;
declare const IS_DEV: boolean;

// store URL received in open-url event when app is closed (macos only)
let openUrlArgs: string[];
let mainWindow: BrowserWindow;

const showMainWindow = (mainWindowState: windowState.State) => {
  mainWindowState.manage(mainWindow);
  // ensure focus, as manage function does not necessarily focus
  mainWindow.show();

  parseProtocolArgs(openUrlArgs || argv, mainWindow);
};

export const saveOpenUrlArgs = (url: string[]) => {
  openUrlArgs = url;
};

export const getMainWindow = () => mainWindow;

export const initMainWindow = (showSplash = true) => {
  const enableDevTools = IS_DEV || !!getRuntimeArg('enable-dev-tools');
  let splashScreen: BrowserWindow;

  // only show the splashscreen when not running the tests
  if (!IS_TESTING && showSplash) {
    splashScreen = createSplashScreen();
  }

  const mainWindowState = windowState({
    defaultWidth: 1024,
    defaultHeight: 768
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    minWidth: 1024,
    minHeight: 768,
    resizable: true,
    maximizable: true,
    minimizable: true,
    width: mainWindowState.width,
    height: mainWindowState.height,
    title: 'Mockoon',
    backgroundColor: '#252830',
    icon: pathJoin(
      __dirname,
      process.platform === 'win32'
        ? '../build-res/icon.ico'
        : '../build-res/icon_512x512x32.png'
    ),
    // directly show the main window when running the tests
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: enableDevTools,
      spellcheck: false,
      preload: pathJoin(__dirname, '/preload.js')
    }
  });

  // maximize before showing the window to avoid a resize event on start (this may break the menu size setting restore)
  if (mainWindowState.isMaximized) {
    mainWindow.maximize();
  }

  if (enableDevTools) {
    mainWindow.webContents.openDevTools();
  }

  // when main app finished loading, hide splashscreen and show the mainWindow
  mainWindow.webContents.on('dom-ready', () => {
    setTimeout(() => {
      if (splashScreen && !splashScreen.isDestroyed()) {
        splashScreen.close();
      }

      // adding a timeout diff (100ms) between splashscreen close and mainWindow.show to fix a bug: https://github.com/electron/electron/issues/27353
      setTimeout(() => {
        showMainWindow(mainWindowState);

        checkForUpdate(mainWindow);
      }, 100);
    }, 500);
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);

  // open all links in external browser
  mainWindow.webContents.setWindowOpenHandler((data) => {
    shell.openExternal(data.url);

    return { action: 'deny' };
  });

  Menu.setApplicationMenu(createMenu(mainWindow));

  return mainWindow;
};
