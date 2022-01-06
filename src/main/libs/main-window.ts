import { BrowserWindow, Menu, shell } from 'electron';
import * as windowState from 'electron-window-state';
import { join as pathJoin } from 'path';
import { argv } from 'process';
import { parseProtocolArgs } from './custom-protocol';
import { createMenu } from './menu';
import { createSplashScreen } from './splashscreen';

declare const isTesting: boolean;
declare const isDev: boolean;

// store URL received in open-url event when app is closed (macos only)
let openUrlArgs: string[];

const showMainWindow = (
  mainWindowState: windowState.State,
  mainWindow: BrowserWindow
) => {
  mainWindowState.manage(mainWindow);
  // ensure focus, as manage function does not necessarily focus
  mainWindow.show();

  parseProtocolArgs(openUrlArgs || argv, mainWindow);
};

export const saveOpenUrlArgs = (url: string[]) => {
  openUrlArgs = url;
};

export const initMainWindow = () => {
  let splashScreen: BrowserWindow;

  // only show the splashscreen when not running the tests
  if (!isTesting) {
    splashScreen = createSplashScreen();
  }

  const mainWindowState = windowState({
    defaultWidth: 1024,
    defaultHeight: 768
  });

  const mainWindow = new BrowserWindow({
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
    icon: pathJoin(__dirname, '/build-res/icon_512x512x32.png'),
    // directly show the main window when running the tests
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev ? true : false,
      spellcheck: false,
      preload: pathJoin(__dirname, '/preload.js')
    }
  });

  // when main app finished loading, hide splashscreen and show the mainWindow
  mainWindow.webContents.on('dom-ready', () => {
    setTimeout(() => {
      if (splashScreen && !splashScreen.isDestroyed()) {
        splashScreen.close();
      }

      // adding a timeout diff (100ms) between splashscreen close and mainWindow.show to fix a bug: https://github.com/electron/electron/issues/27353
      setTimeout(() => {
        showMainWindow(mainWindowState, mainWindow);

        if (isDev) {
          mainWindow.webContents.openDevTools();
        }
      }, 100);
    }, 500);
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);

  // intercept all links and open in a new window
  mainWindow.webContents.on('new-window', (event, targetUrl) => {
    event.preventDefault();

    if (targetUrl.includes('openexternal::')) {
      shell.openExternal(targetUrl.split('::')[1]);
    }
  });

  Menu.setApplicationMenu(createMenu(mainWindow));

  return mainWindow;
};
