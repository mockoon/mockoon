import { BrowserWindow, Menu } from 'electron';

export const handleZoomIn = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  menuInstance.getMenuItemById('MENU_ZOOM_OUT').enabled = true;

  if (mainWindow.webContents.zoomFactor >= 1.3) {
    return;
  }

  mainWindow.webContents.zoomFactor += 0.1;

  if (mainWindow.webContents.zoomFactor >= 1.3) {
    menuInstance.getMenuItemById('MENU_ZOOM_IN').enabled = false;
  }
};

export const handleZoomOut = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  menuInstance.getMenuItemById('MENU_ZOOM_IN').enabled = true;

  if (mainWindow.webContents.zoomFactor <= 0.8) {
    return;
  }

  mainWindow.webContents.zoomFactor -= 0.1;

  if (mainWindow.webContents.zoomFactor <= 0.8) {
    menuInstance.getMenuItemById('MENU_ZOOM_OUT').enabled = false;
  }
};

export const handleZoomReset = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  menuInstance.getMenuItemById('MENU_ZOOM_IN').enabled = true;
  menuInstance.getMenuItemById('MENU_ZOOM_OUT').enabled = true;

  mainWindow.webContents.zoomFactor = 1;
};
