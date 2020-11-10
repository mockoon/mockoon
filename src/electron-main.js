process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const logs = require('electron-log');
logs.catchErrors();

const objectPath = require('object-path');
const electron = require('electron');
const windowState = require('electron-window-state');
const path = require('path');
const url = require('url');
const isDev = require('electron-is-dev');

const app = electron.app;
const ipcMain = electron.ipcMain;
const shell = electron.shell;
const browserWindow = electron.BrowserWindow;
let mainWindow;
let splashScreen;

// get command line args
const args = process.argv.slice(1);
const isServing = args.some((val) => val === '--serve');
const isTesting = args.some((val) => val === '--tests');

// set local data folder when in dev mode or running tests
if (isTesting || isDev) {
  app.setPath('userData', path.resolve('./tmp'));
}

// when serving (devmode) enable hot reloading
if (isDev && isServing) {
  require('electron-reload')(__dirname, {});
}

const createSplashScreen = function () {
  splashScreen = new browserWindow({
    width: 350,
    maxWidth: 350,
    minWidth: 350,
    height: 150,
    maxHeight: 150,
    minHeight: 150,
    frame: false,
    transparent: true,
    resizable: false,
    fullscreenable: false,
    center: true,
    fullscreen: false,
    show: true,
    movable: true,
    maximizable: false,
    minimizable: false,
    icon: path.join(__dirname, '/icon_512x512x32.png')
  });

  splashScreen.loadURL(
    url.format({
      pathname: path.join(__dirname, 'splashscreen.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  splashScreen.on('closed', () => {
    splashScreen = null;
  });

  splashScreen.once('ready-to-show', () => {
    splashScreen.show();
  });
};

const createAppMenu = function () {
  const menu = [
    {
      label: 'Application',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: function () {
            mainWindow.webContents.send('keydown', { action: 'OPEN_SETTINGS' });
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
        click: function () {
          mainWindow.webContents.send('keydown', { action: 'NEW_ENVIRONMENT' });
        }
      },
      {
        label: 'Add new route',
        accelerator: 'Shift+CmdOrCtrl+R',
        click: function () {
          mainWindow.webContents.send('keydown', { action: 'NEW_ROUTE' });
        }
      },
      { type: 'separator' },
      {
        label: 'Duplicate current environment',
        accelerator: 'CmdOrCtrl+D',
        click: function () {
          mainWindow.webContents.send('keydown', {
            action: 'DUPLICATE_ENVIRONMENT'
          });
        }
      },
      {
        label: 'Duplicate current route',
        accelerator: 'Shift+CmdOrCtrl+D',
        click: function () {
          mainWindow.webContents.send('keydown', { action: 'DUPLICATE_ROUTE' });
        }
      },
      { type: 'separator' },
      {
        label: 'Delete current environment',
        accelerator: 'Alt+CmdOrCtrl+U',
        click: function () {
          mainWindow.webContents.send('keydown', {
            action: 'DELETE_ENVIRONMENT'
          });
        }
      },
      {
        label: 'Delete current route',
        accelerator: 'Alt+Shift+CmdOrCtrl+U',
        click: function () {
          mainWindow.webContents.send('keydown', { action: 'DELETE_ROUTE' });
        }
      },
      { type: 'separator' },
      {
        label: 'Start/Stop/Reload current environment',
        accelerator: 'Shift+CmdOrCtrl+S',
        click: function () {
          mainWindow.webContents.send('keydown', {
            action: 'START_ENVIRONMENT'
          });
        }
      },
      {
        label: 'Start/Stop/Reload all environments',
        accelerator: 'Shift+CmdOrCtrl+A',
        click: function () {
          mainWindow.webContents.send('keydown', {
            action: 'START_ALL_ENVIRONMENTS'
          });
        }
      },
      { type: 'separator' },
      {
        label: 'Select previous environment',
        accelerator: 'CmdOrCtrl+Up',
        click: function () {
          mainWindow.webContents.send('keydown', {
            action: 'PREVIOUS_ENVIRONMENT'
          });
        }
      },
      {
        label: 'Select next environment',
        accelerator: 'CmdOrCtrl+Down',
        click: function () {
          mainWindow.webContents.send('keydown', {
            action: 'NEXT_ENVIRONMENT'
          });
        }
      },
      {
        label: 'Select previous route',
        accelerator: 'Shift+CmdOrCtrl+Up',
        click: function () {
          mainWindow.webContents.send('keydown', { action: 'PREVIOUS_ROUTE' });
        }
      },
      {
        label: 'Select next route',
        accelerator: 'Shift+CmdOrCtrl+Down',
        click: function () {
          mainWindow.webContents.send('keydown', { action: 'NEXT_ROUTE' });
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
            click: function () {
              mainWindow.webContents.send('keydown', {
                action: 'IMPORT_CLIPBOARD'
              });
            }
          },
          {
            label: 'Import from a file (JSON)',
            click: function () {
              mainWindow.webContents.send('keydown', { action: 'IMPORT_FILE' });
            }
          },
          {
            label: 'Export all environments to a file (JSON)',
            accelerator: 'CmdOrCtrl+O',
            click: function () {
              mainWindow.webContents.send('keydown', { action: 'EXPORT_FILE' });
            }
          },
          {
            label: 'Export current environment to a file (JSON)',
            click: function () {
              mainWindow.webContents.send('keydown', {
                action: 'EXPORT_FILE_SELECTED'
              });
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
            click: function () {
              mainWindow.webContents.send('keydown', {
                action: 'IMPORT_OPENAPI_FILE'
              });
            }
          },
          {
            label: 'Export current environment to OpenAPI v3 (JSON)',
            click: function () {
              mainWindow.webContents.send('keydown', {
                action: 'EXPORT_OPENAPI_FILE'
              });
            }
          }
        ]
      }
    ]
  });

  menu.push({
    label: 'Help',
    submenu: [
      {
        label: 'Official website',
        click: function () {
          shell.openExternal('https://mockoon.com');
        }
      },
      {
        label: 'Docs',
        click: function () {
          shell.openExternal('https://mockoon.com/docs');
        }
      },
      {
        label: 'Release notes',
        click: function () {
          mainWindow.webContents.send('keydown', {
            action: 'OPEN_CHANGELOG'
          });
        }
      },
      {
        label: 'Community / Chat',
        click: function () {
          shell.openExternal('https://github.com/mockoon/mockoon/discussions');
        }
      },
      { type: 'separator' },
      {
        label: 'Show app data folder',
        click: function () {
          shell.showItemInFolder(app.getPath('userData'));
        }
      }
    ]
  });

  return menu;
};

const init = function () {
  if (!isTesting) {
    /**
     * Delay splashscreen launch due to transparency not available directly after app "ready" event
     * See https://github.com/electron/electron/issues/15947 and https://stackoverflow.com/questions/53538215/cant-succeed-in-making-transparent-window-in-electron-javascript
     */
    setTimeout(
      () => {
        createSplashScreen();
      },
      process.platform === 'linux' ? 500 : 0
    );
  }

  const mainWindowState = windowState({
    defaultWidth: 1024,
    defaultHeight: 768
  });

  mainWindow = new browserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    minWidth: 1024,
    minHeight: 768,
    width: mainWindowState.width,
    height: mainWindowState.height,
    title: 'Mockoon',
    backgroundColor: '#252830',
    icon: path.join(__dirname, '/icon_512x512x32.png'),
    // directly show the main window when running the tests
    show: isTesting ? true : false,
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev ? true : false,
      enableRemoteModule: true,
      spellcheck: false
    }
  });

  if (isTesting) {
    mainWindowState.manage(mainWindow);
    // ensure focus, as manage function does not necessarily focus
    mainWindow.show();
  } else {
    // when main app finished loading, hide splashscreen and show the mainWindow
    mainWindow.webContents.on('did-finish-load', () => {
      if (splashScreen) {
        splashScreen.close();
      }

      mainWindowState.manage(mainWindow);
      // ensure focus, as manage function does not necessarily focus
      mainWindow.show();
    });
  }

  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  // Open the DevTools in dev mode except when running functional tests
  if (isDev && !isTesting) {
    mainWindow.webContents.openDevTools();
  }

  // intercept all links and open in a new window
  mainWindow.webContents.on('new-window', (event, targetUrl) => {
    event.preventDefault();

    if (targetUrl.includes('openexternal::')) {
      shell.openExternal(targetUrl.split('::')[1]);
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  electron.Menu.setApplicationMenu(
    electron.Menu.buildFromTemplate(createAppMenu())
  );
};

const toggleExportMenuItems = function (state) {
  const menu = electron.Menu.getApplicationMenu();

  if (
    menu &&
    objectPath.has(menu, 'items.2.submenu.items.0.submenu.items.2') &&
    objectPath.has(menu, 'items.2.submenu.items.2.submenu.items.1')
  ) {
    menu.items[2].submenu.items[0].submenu.items[2].enabled = state;
    menu.items[2].submenu.items[0].submenu.items[3].enabled = state;
    menu.items[2].submenu.items[2].submenu.items[1].enabled = state;
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q (except when running tests)
  if (process.platform !== 'darwin' || isTesting) {
    app.quit();
  }
});

// Quit requested by renderer (when waiting for save to finish)
ipcMain.on('renderer-app-quit', function () {
  // destroy the window otherwise app.quit() will trigger beforeunload again. Also there is no app.quit for macos
  mainWindow.destroy();
});

ipcMain.on('disable-export', function () {
  toggleExportMenuItems(false);
});

ipcMain.on('enable-export', function () {
  toggleExportMenuItems(true);
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    init();
  }
});
