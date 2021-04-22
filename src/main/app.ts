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
import axios from 'axios';
import { spawn } from 'child_process';
import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  shell
} from 'electron';
import * as isDev from 'electron-is-dev';
import { get as storageGet, set as storageSet } from 'electron-json-storage';
import {
  catchErrors as logCatchErrors,
  error as logError,
  info as logInfo,
  transports as logTransports
} from 'electron-log';
import * as windowState from 'electron-window-state';
import { createWriteStream, promises as fsPromises } from 'fs';
import { lookup as mimeTypeLookup } from 'mime-types';
import { has as objectPathHas } from 'object-path';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { gt as semverGt } from 'semver';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);
const appVersion: string = require('./package.json').version;

// get command line args
const args = process.argv.slice(1);
const isServing = args.some((val) => val === '--serve');
const isTesting = args.some((val) => val === '--tests');

// set local data folder when in dev mode or running tests
if (isTesting || isDev) {
  app.setPath('userData', pathResolve('./tmp'));

  logTransports.file.resolvePath = (variables: any) =>
    pathJoin(pathResolve('./tmp/logs'), 'main.log');
}

logCatchErrors({
  onError: (error: Error) => {
    logError(error);

    return false;
  }
});

if (!isDev) {
  process.env.NODE_ENV = 'production';
}

// running Mockoon server instances
const runningServerInstances: { [key in string]: MockoonServer } = {};
// store the up-to-data environments for server hot reload
const updatedEnvironments: { [key in string]: Environment } = {};
const userDataPath = app.getPath('userData');
let mainWindow: BrowserWindow;
let splashScreen: BrowserWindow;
let updateAvailableVersion: string;

// when serving (devmode) enable hot reloading
if (isDev && isServing) {
  try {
    require('electron-reloader')(module);
  } catch (e) {}
}

const createSplashScreen = () => {
  splashScreen = new BrowserWindow({
    width: 450,
    maxWidth: 450,
    minWidth: 450,
    height: 175,
    maxHeight: 175,
    minHeight: 175,
    frame: false,
    resizable: false,
    fullscreenable: false,
    center: true,
    fullscreen: false,
    show: false,
    movable: true,
    maximizable: false,
    minimizable: false,
    backgroundColor: '#3C637C',
    icon: pathJoin(__dirname, '/icon_512x512x32.png')
  });

  splashScreen.loadURL(`file://${__dirname}/splashscreen.html`);

  splashScreen.on('closed', () => {
    splashScreen.destroy();
  });

  splashScreen.once('ready-to-show', () => {
    splashScreen.show();
  });
};

const createAppMenu = () => {
  const menu: any = [
    {
      label: 'Application',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'OPEN_SETTINGS');
          }
        },
        { type: 'separator' }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    menu[0].submenu.push(
      { label: 'Hide', role: 'hide' },
      { role: 'hideOthers' },
      { type: 'separator' }
    );
  }

  menu[0].submenu.push({ label: 'Quit', role: 'quit' });

  // add edit menu for mac (for copy paste)
  if (process.platform === 'darwin') {
    menu.push({
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:'
        }
      ]
    });
  }

  // add actions menu, send action through web contents
  menu.push({
    label: 'Actions',
    submenu: [
      {
        label: 'Add new environment',
        accelerator: 'Shift+CmdOrCtrl+E',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'NEW_ENVIRONMENT');
        }
      },
      {
        label: 'Add new route',
        accelerator: 'Shift+CmdOrCtrl+R',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'NEW_ROUTE');
        }
      },
      { type: 'separator' },
      {
        label: 'Duplicate current environment',
        accelerator: 'CmdOrCtrl+D',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'DUPLICATE_ENVIRONMENT');
        }
      },
      {
        label: 'Duplicate current route',
        accelerator: 'Shift+CmdOrCtrl+D',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'DUPLICATE_ROUTE');
        }
      },
      { type: 'separator' },
      {
        label: 'Delete current environment',
        accelerator: 'Alt+CmdOrCtrl+U',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'DELETE_ENVIRONMENT');
        }
      },
      {
        label: 'Delete current route',
        accelerator: 'Alt+Shift+CmdOrCtrl+U',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'DELETE_ROUTE');
        }
      },
      { type: 'separator' },
      {
        label: 'Start/Stop/Reload current environment',
        accelerator: 'Shift+CmdOrCtrl+S',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'START_ENVIRONMENT');
        }
      },
      {
        label: 'Start/Stop/Reload all environments',
        accelerator: 'Shift+CmdOrCtrl+A',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'START_ALL_ENVIRONMENTS');
        }
      },
      { type: 'separator' },
      {
        label: 'Select previous environment',
        accelerator: 'CmdOrCtrl+Up',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'PREVIOUS_ENVIRONMENT');
        }
      },
      {
        label: 'Select next environment',
        accelerator: 'CmdOrCtrl+Down',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'NEXT_ENVIRONMENT');
        }
      },
      {
        label: 'Select previous route',
        accelerator: 'Shift+CmdOrCtrl+Up',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'PREVIOUS_ROUTE');
        }
      },
      {
        label: 'Select next route',
        accelerator: 'Shift+CmdOrCtrl+Down',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'NEXT_ROUTE');
        }
      }
    ]
  });

  menu.push({
    label: 'Import/export',
    submenu: [
      {
        label: "Mockoon's format",
        submenu: [
          {
            label: 'Import from clipboard',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'IMPORT_CLIPBOARD');
            }
          },
          {
            label: 'Import from a file (JSON)',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'IMPORT_FILE');
            }
          },
          {
            label: 'Export all environments to a file (JSON)',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'EXPORT_FILE');
            }
          },
          {
            label: 'Export current environment to a file (JSON)',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'EXPORT_FILE_SELECTED');
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Swagger/OpenAPI',
        submenu: [
          {
            label: 'Import Swagger v2/OpenAPI v3 (JSON or YAML)',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'IMPORT_OPENAPI_FILE');
            }
          },
          {
            label: 'Export current environment to OpenAPI v3 (JSON)',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'EXPORT_OPENAPI_FILE');
            }
          }
        ]
      }
    ]
  });

  menu.push({
    label: 'Tools',
    submenu: [
      {
        label: 'CLI',
        click: () => {
          shell.openExternal('https://mockoon.com/cli/');
        }
      },
      {
        label: 'Docker repository',
        click: () => {
          shell.openExternal('https://hub.docker.com/u/mockoon');
        }
      },
      { type: 'separator' },
      {
        label: 'Show app data folder',
        click: () => {
          shell.showItemInFolder(app.getPath('userData'));
        }
      }
    ]
  });

  menu.push({
    label: 'Help',
    submenu: [
      {
        label: 'Official website',
        click: () => {
          shell.openExternal('https://mockoon.com');
        }
      },
      {
        label: 'Docs',
        click: () => {
          shell.openExternal('https://mockoon.com/docs');
        }
      },
      {
        label: 'Tutorials',
        click: () => {
          shell.openExternal('https://mockoon.com/tutorials/');
        }
      },
      {
        label: 'Get support',
        click: () => {
          shell.openExternal('https://mockoon.com/contact/');
        }
      },
      { type: 'separator' },
      {
        label: 'Release notes',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'OPEN_CHANGELOG');
        }
      }
    ]
  });

  return menu;
};

const checkForUpdate = async () => {
  const githubLatestReleaseUrl =
    'https://api.github.com/repos/mockoon/mockoon/releases/latest';
  const githubBinaryDownloadUrl =
    'https://github.com/mockoon/mockoon/releases/download/';
  let releaseResponse;

  try {
    // try to remove existing old update
    await fsPromises.unlink(
      pathJoin(userDataPath, `mockoon.setup.${appVersion}.exe`)
    );
    logInfo('[MAIN][UPDATE]Removed old update file');
  } catch (error) {}

  try {
    releaseResponse = await axios.get(githubLatestReleaseUrl);
  } catch (error) {
    logError(`[MAIN][UPDATE]Error while checking for update: ${error.message}`);

    return;
  }

  const latestVersion = releaseResponse.data.tag_name.replace('v', '');

  if (semverGt(latestVersion, appVersion)) {
    logInfo(`[MAIN][UPDATE]Found a new version v${latestVersion}`);

    if (process.platform === 'win32') {
      const binaryFilename = `mockoon.setup.${latestVersion}.exe`;
      const updateFilePath = pathJoin(userDataPath, binaryFilename);

      try {
        await fsPromises.access(updateFilePath);
        logInfo('[MAIN][UPDATE]Binary file already downloaded');
        mainWindow.webContents.send('APP_UPDATE_AVAILABLE');
        updateAvailableVersion = latestVersion;

        return;
      } catch (error) {}

      logInfo('[MAIN][UPDATE]Downloading binary file');

      try {
        const response = await axios.get(
          `${githubBinaryDownloadUrl}v${latestVersion}/${binaryFilename}`,
          { responseType: 'stream' }
        );
        await streamPipeline(response.data, createWriteStream(updateFilePath));
        logInfo('[MAIN][UPDATE]Binary file ready');
        mainWindow.webContents.send('APP_UPDATE_AVAILABLE');
        updateAvailableVersion = latestVersion;
      } catch (error) {
        logError(
          `[MAIN][UPDATE]Error while downloading the binary: ${error.message}`
        );
      }
    } else {
      mainWindow.webContents.send('APP_UPDATE_AVAILABLE');
      updateAvailableVersion = latestVersion;
    }
  } else {
    logInfo('[MAIN][UPDATE]Application is up to date');
  }
};

const init = () => {
  // only show the splashscreen when not running the tests
  if (!isTesting) {
    createSplashScreen();
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
    icon: pathJoin(__dirname, '/icon_512x512x32.png'),
    // directly show the main window when running the tests
    show: isTesting ? true : false,
    webPreferences: {
      // Spectron still relies on node integration and remote module, we need to disable contextIsolation too https://github.com/electron-userland/spectron/issues/693
      enableRemoteModule: isTesting ? true : false,
      nodeIntegration: isTesting ? true : false,
      contextIsolation: isTesting ? false : true,
      sandbox: isTesting ? false : true,
      devTools: isDev ? true : false,
      spellcheck: false,
      preload: pathJoin(__dirname, '/preload.js')
    }
  });

  if (isTesting) {
    mainWindowState.manage(mainWindow);
    // ensure focus, as manage function does not necessarily focus
    mainWindow.show();
  } else {
    // when main app finished loading, hide splashscreen and show the mainWindow
    // use two timeout as page is still assembling after "dom-ready" event
    mainWindow.webContents.on('dom-ready', () => {
      setTimeout(() => {
        if (splashScreen && !splashScreen.isDestroyed()) {
          splashScreen.close();
        }

        // adding a timeout diff (100ms) between splashscreen close and mainWindow.show to fix a bug: https://github.com/electron/electron/issues/27353
        setTimeout(() => {
          mainWindowState.manage(mainWindow);
          // ensure focus, as manage function does not necessarily focus
          mainWindow.show();

          checkForUpdate();

          // Open the DevTools in dev mode except when running functional tests
          if (isDev && !isTesting) {
            mainWindow.webContents.openDevTools();
          }
        }, 100);
      }, 500);
    });
  }

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // intercept all links and open in a new window
  mainWindow.webContents.on('new-window', (event, targetUrl) => {
    event.preventDefault();

    if (targetUrl.includes('openexternal::')) {
      shell.openExternal(targetUrl.split('::')[1]);
    }
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(createAppMenu()));
};

const toggleExportMenuItems = (state: boolean) => {
  const menu = Menu.getApplicationMenu();

  if (
    menu &&
    objectPathHas(menu, 'items.2.submenu.items.0.submenu.items.2') &&
    objectPathHas(menu, 'items.2.submenu.items.2.submenu.items.1')
  ) {
    ((menu.items[2].submenu as Menu).items[0]
      .submenu as Menu).items[2].enabled = state;
    ((menu.items[2].submenu as Menu).items[0]
      .submenu as Menu).items[3].enabled = state;
    ((menu.items[2].submenu as Menu).items[2]
      .submenu as Menu).items[1].enabled = state;
  }
};

// try getting a lock to ensure only one instance of the application is launched
const appLock = app.requestSingleInstanceLock();

if (!appLock) {
  logInfo(
    '[MAIN]An instance of the application is already running. Stopping process.'
  );
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
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
    init();

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) init();
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

    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q (except when running tests)
    if (process.platform !== 'darwin' || isTesting) {
      app.quit();
    }
  });

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

  ipcMain.on('APP_WRITE_CLIPBOARD', async (event, data) => {
    clipboard.writeText(data, 'clipboard');
  });

  ipcMain.on('APP_UPDATE_ENVIRONMENT', (event, environments: Environments) => {
    environments.forEach((environment) => {
      updatedEnvironments[environment.uuid] = environment;
    });
  });

  ipcMain.on('APP_APPLY_UPDATE', () => {
    if (updateAvailableVersion) {
      if (process.platform === 'win32') {
        spawn(
          pathJoin(userDataPath, `mockoon.setup.${updateAvailableVersion}.exe`),
          ['--updated'],
          {
            detached: true,
            stdio: 'ignore'
          }
        ).unref();
        app.quit();
      } else if (
        process.platform === 'darwin' ||
        process.platform === 'linux'
      ) {
        shell.openExternal('https://mockoon.com/download');
      }
    }
  });
}
