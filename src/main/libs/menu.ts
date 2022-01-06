import { app, BrowserWindow, Menu, shell } from 'electron';

export const createMenu = (mainWindow: BrowserWindow): Menu => {
  const menu: any = [
    {
      label: 'Application',
      submenu: [
        {
          id: 'OPEN_SETTINGS',
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'OPEN_SETTINGS');
          }
        },
        { type: 'separator' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New environment',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'NEW_ENVIRONMENT');
          }
        },
        {
          label: 'Open environment',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'OPEN_ENVIRONMENT');
          }
        },
        {
          id: 'DUPLICATE_ENVIRONMENT',
          label: 'Duplicate current environment',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'DUPLICATE_ENVIRONMENT');
          }
        },
        { type: 'separator' },
        {
          id: 'CLOSE_ENVIRONMENT',
          label: 'Close active environment',
          accelerator: 'CmdOrCtrl+F4',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'CLOSE_ENVIRONMENT');
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

  // add edit menu for mac (for copy/paste)
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

  menu.push({
    label: 'Routes',
    submenu: [
      {
        id: 'NEW_ROUTE',
        label: 'Add new route',
        accelerator: 'Shift+CmdOrCtrl+R',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'NEW_ROUTE');
        }
      },
      {
        id: 'DUPLICATE_ROUTE',
        label: 'Duplicate current route',
        accelerator: 'Shift+CmdOrCtrl+D',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'DUPLICATE_ROUTE');
        }
      },
      { type: 'separator' },
      {
        id: 'DELETE_ROUTE',
        label: 'Delete current route',
        accelerator: 'Alt+Shift+CmdOrCtrl+U',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'DELETE_ROUTE');
        }
      }
    ]
  });

  menu.push({
    label: 'Run',
    submenu: [
      {
        id: 'START_ENVIRONMENT',
        label: 'Start/Stop/Reload current environment',
        accelerator: 'Shift+CmdOrCtrl+S',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'START_ENVIRONMENT');
        }
      },
      {
        id: 'START_ALL_ENVIRONMENTS',
        label: 'Start/Stop/Reload all environments',
        accelerator: 'Shift+CmdOrCtrl+A',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'START_ALL_ENVIRONMENTS');
        }
      }
    ]
  });

  menu.push({
    label: 'Navigate',
    submenu: [
      {
        id: 'PREVIOUS_ENVIRONMENT',
        label: 'Select previous environment',
        accelerator: 'CmdOrCtrl+Up',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'PREVIOUS_ENVIRONMENT');
        }
      },
      {
        id: 'NEXT_ENVIRONMENT',
        label: 'Select next environment',
        accelerator: 'CmdOrCtrl+Down',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'NEXT_ENVIRONMENT');
        }
      },
      {
        id: 'PREVIOUS_ROUTE',
        label: 'Select previous route',
        accelerator: 'Shift+CmdOrCtrl+Up',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'PREVIOUS_ROUTE');
        }
      },
      {
        id: 'NEXT_ROUTE',
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
            id: 'IMPORT_CLIPBOARD',
            label: 'Import from clipboard',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'IMPORT_CLIPBOARD');
            }
          },
          {
            id: 'IMPORT_FILE',
            label: 'Import from a file (JSON)',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'IMPORT_FILE');
            }
          },
          {
            id: 'EXPORT_FILE',
            label: 'Export all environments to a file (JSON)',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'EXPORT_FILE');
            }
          },
          {
            id: 'EXPORT_FILE_SELECTED',
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
            id: 'IMPORT_OPENAPI_FILE',
            label: 'Import Swagger v2/OpenAPI v3 (JSON or YAML)',
            click: () => {
              mainWindow.webContents.send('APP_MENU', 'IMPORT_OPENAPI_FILE');
            }
          },
          {
            id: 'EXPORT_OPENAPI_FILE',
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
      {
        label: 'Mock samples',
        click: () => {
          shell.openExternal('https://mockoon.com/mock-samples/');
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

  return Menu.buildFromTemplate(menu);
};

export const toggleEnvironmentMenuItems = (state: boolean) => {
  const menu = Menu.getApplicationMenu();
  [
    'DUPLICATE_ENVIRONMENT',
    'CLOSE_ENVIRONMENT',
    'NEW_ROUTE',
    'DUPLICATE_ROUTE',
    'DELETE_ROUTE',
    'START_ENVIRONMENT',
    'START_ALL_ENVIRONMENTS',
    'PREVIOUS_ENVIRONMENT',
    'NEXT_ENVIRONMENT',
    'PREVIOUS_ROUTE',
    'NEXT_ROUTE',
    'EXPORT_FILE',
    'EXPORT_FILE_SELECTED',
    'EXPORT_OPENAPI_FILE'
  ].forEach((id) => {
    const menuItem = menu?.getMenuItemById(id);

    if (menuItem) {
      menuItem.enabled = state;
    }
  });
};

export const toggleRouteMenuItems = (state: boolean) => {
  const menu = Menu.getApplicationMenu();
  ['DUPLICATE_ROUTE', 'DELETE_ROUTE', 'PREVIOUS_ROUTE', 'NEXT_ROUTE'].forEach(
    (id) => {
      const menuItem = menu?.getMenuItemById(id);

      if (menuItem) {
        menuItem.enabled = state;
      }
    }
  );
};
