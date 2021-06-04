import { app, BrowserWindow, Menu, shell } from 'electron';
import { has as objectPathHas } from 'object-path';

export const createMenu = (mainWindow: BrowserWindow): Menu => {
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

  return Menu.buildFromTemplate(menu);
};

export const toggleExportMenuItems = (state: boolean) => {
  const menu = Menu.getApplicationMenu();

  if (
    menu &&
    objectPathHas(menu, 'items.2.submenu.items.0.submenu.items.2') &&
    objectPathHas(menu, 'items.2.submenu.items.2.submenu.items.1')
  ) {
    (
      (menu.items[2].submenu as Menu).items[0].submenu as Menu
    ).items[2].enabled = state;
    (
      (menu.items[2].submenu as Menu).items[0].submenu as Menu
    ).items[3].enabled = state;
    (
      (menu.items[2].submenu as Menu).items[2].submenu as Menu
    ).items[1].enabled = state;
  }
};
