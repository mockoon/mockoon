import { BrowserWindow, Menu, shell } from 'electron';
import { Config } from 'src/main/config';
import { showFolderInExplorer } from 'src/main/libs/paths';
import {
  handleZoomIn,
  handleZoomOut,
  handleZoomReset
} from 'src/main/libs/zoom';
import { MenuStateUpdatePayload } from 'src/shared/models/ipc.model';

export const createMenu = (mainWindow: BrowserWindow): Menu => {
  const menu: any = [
    {
      label: 'Application',
      submenu: [
        {
          id: 'MENU_OPEN_SETTINGS',
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
          id: 'MENU_NEW_ENVIRONMENT',
          label: 'New local environment',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'NEW_ENVIRONMENT');
          }
        },
        {
          id: 'MENU_NEW_ENVIRONMENT_CLIPBOARD',
          label: 'New local environment from clipboard',
          click: () => {
            mainWindow.webContents.send(
              'APP_MENU',
              'NEW_ENVIRONMENT_CLIPBOARD'
            );
          }
        },
        {
          id: 'MENU_OPEN_ENVIRONMENT',
          label: 'Open local environment',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'OPEN_ENVIRONMENT');
          }
        },
        {
          id: 'MENU_DUPLICATE_ENVIRONMENT',
          label: 'Duplicate current environment to local',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'DUPLICATE_ENVIRONMENT');
          }
        },
        { type: 'separator' },
        {
          id: 'MENU_NEW_CLOUD_ENVIRONMENT',
          label: 'New cloud environment',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'NEW_CLOUD_ENVIRONMENT');
          }
        },
        { type: 'separator' },
        {
          id: 'MENU_PREVIOUS_ENVIRONMENT',
          label: 'Select previous environment',
          accelerator: 'CmdOrCtrl+Up',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'PREVIOUS_ENVIRONMENT');
          }
        },
        {
          id: 'MENU_NEXT_ENVIRONMENT',
          label: 'Select next environment',
          accelerator: 'CmdOrCtrl+Down',
          click: () => {
            mainWindow.webContents.send('APP_MENU', 'NEXT_ENVIRONMENT');
          }
        },
        { type: 'separator' },
        {
          id: 'MENU_CLOSE_ENVIRONMENT',
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
      { type: 'separator' },
      { label: 'Close window', accelerator: 'CmdOrCtrl+W', role: 'close' }
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
        id: 'MENU_NEW_ROUTE',
        label: 'Add new route',
        accelerator: 'Shift+CmdOrCtrl+R',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'NEW_ROUTE');
        }
      },
      {
        id: 'MENU_NEW_ROUTE_CLIPBOARD',
        label: 'Add route from clipboard',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'NEW_ROUTE_CLIPBOARD');
        }
      },
      {
        id: 'MENU_DUPLICATE_ROUTE',
        label: 'Duplicate current route',
        accelerator: 'Shift+CmdOrCtrl+D',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'DUPLICATE_ROUTE');
        }
      },
      { type: 'separator' },
      {
        id: 'MENU_DELETE_ROUTE',
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
        id: 'MENU_START_ENVIRONMENT',
        label: 'Start/Stop/Reload current environment',
        accelerator: 'Shift+CmdOrCtrl+S',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'START_ENVIRONMENT');
        }
      },
      {
        id: 'MENU_START_ALL_ENVIRONMENTS',
        label: 'Start/Stop/Reload all environments',
        accelerator: 'Shift+CmdOrCtrl+A',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'START_ALL_ENVIRONMENTS');
        }
      }
    ]
  });

  menu.push({
    label: 'Import/export',
    submenu: [
      {
        id: 'MENU_IMPORT_OPENAPI_FILE',
        label: 'Import Swagger v2/OpenAPI v3 (JSON or YAML)',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'IMPORT_OPENAPI_FILE');
        }
      },
      {
        id: 'MENU_EXPORT_OPENAPI_FILE',
        label: 'Export current environment to OpenAPI v3 (JSON)',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'EXPORT_OPENAPI_FILE');
        }
      }
    ]
  });

  menu.push({
    label: 'View',
    submenu: [
      {
        id: 'MENU_ZOOM_OUT',
        label: 'Zoom out',
        accelerator: 'CmdOrCtrl+NumSub',
        click: () => {
          handleZoomOut(mainWindow);
        }
      },
      // zoom out aliases
      {
        label: 'Zoom out',
        accelerator: 'CmdOrCtrl+-',
        click: () => {
          handleZoomOut(mainWindow);
        },
        visible: false
      },
      {
        label: 'Reset zoom',
        accelerator: 'CmdOrCtrl+Num0',
        click: () => {
          handleZoomReset(mainWindow);
        }
      },
      // reset zoom aliases
      {
        label: 'Reset zoom',
        accelerator: 'CmdOrCtrl+0',
        click: () => {
          handleZoomReset(mainWindow);
        },
        visible: false
      },
      {
        id: 'MENU_ZOOM_IN',
        label: 'Zoom in',
        accelerator: 'CmdOrCtrl+Plus',
        click: () => {
          handleZoomIn(mainWindow);
        }
      },
      // zoom in aliases
      {
        label: 'Zoom in',
        accelerator: 'CmdOrCtrl+NumAdd',
        click: () => {
          handleZoomIn(mainWindow);
        },
        visible: false
      },
      {
        label: 'Zoom in',
        accelerator: 'CmdOrCtrl+=',
        click: () => {
          handleZoomIn(mainWindow);
        },
        visible: false
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
          showFolderInExplorer('userData');
        }
      },
      {
        label: 'Show logs folder',
        click: () => {
          showFolderInExplorer('logs');
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
        label: 'Take the tour',
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'TOUR_START');
        }
      },
      {
        label: `Release notes v${Config.appVersion}`,
        click: () => {
          mainWindow.webContents.send('APP_MENU', 'OPEN_CHANGELOG');
        }
      }
    ]
  });

  return Menu.buildFromTemplate(menu);
};

// menu items requiring at least one environment
const requireEnvironmentsMenuItems = [
  'MENU_DUPLICATE_ENVIRONMENT',
  'MENU_CLOSE_ENVIRONMENT',
  'MENU_NEW_ROUTE',
  'MENU_DUPLICATE_ROUTE',
  'MENU_DELETE_ROUTE',
  'MENU_START_ENVIRONMENT',
  'MENU_START_ALL_ENVIRONMENTS',
  'MENU_PREVIOUS_ENVIRONMENT',
  'MENU_NEXT_ENVIRONMENT',
  'MENU_PREVIOUS_ROUTE',
  'MENU_NEXT_ROUTE',
  'MENU_EXPORT_OPENAPI_FILE'
];

// menu items requiring cloud to be active
const requireCloudMenuItems = ['MENU_NEW_CLOUD_ENVIRONMENT'];
// menu items requiring an active cloud environment
const requireCloudActiveEnvironmentMenuItems = ['MENU_CLOSE_ENVIRONMENT'];
// route specific menu items based on active environment routes count
const requireRoutesMenuItems = [
  'MENU_DUPLICATE_ROUTE',
  'MENU_DELETE_ROUTE',
  'MENU_PREVIOUS_ROUTE',
  'MENU_NEXT_ROUTE'
];

const toggleMenuItems = (items: string[], enabled: boolean) => {
  const menu = Menu.getApplicationMenu();

  items.forEach((id) => {
    const menuItem = menu?.getMenuItemById(id);

    if (menuItem) {
      menuItem.enabled = enabled;
    }
  });
};

export const updateMenuState = (state: MenuStateUpdatePayload) => {
  toggleMenuItems(requireEnvironmentsMenuItems, state.environmentsCount > 0);
  toggleMenuItems(requireCloudMenuItems, state.cloudEnabled);
  toggleMenuItems(
    requireCloudActiveEnvironmentMenuItems,
    !state.isActiveEnvironmentCloud
  );
  toggleMenuItems(
    requireRoutesMenuItems,
    state.activeEnvironmentRoutesCount > 0
  );
};
