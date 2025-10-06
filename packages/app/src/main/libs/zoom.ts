import { BrowserWindow, Menu } from 'electron';

const defaultZoomFactor = 1;
const maxZoomFactor = 1.6;
const minZoomFactor = 0.8;
const zoomStep = 0.1;

export const handleZoomIn = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  menuInstance.getMenuItemById('MENU_ZOOM_OUT').enabled = true;

  if (mainWindow.webContents.zoomFactor >= maxZoomFactor) {
    return;
  }

  mainWindow.webContents.zoomFactor += zoomStep;

  if (mainWindow.webContents.zoomFactor >= maxZoomFactor) {
    menuInstance.getMenuItemById('MENU_ZOOM_IN').enabled = false;
  }
};

export const handleZoomOut = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  menuInstance.getMenuItemById('MENU_ZOOM_IN').enabled = true;

  if (mainWindow.webContents.zoomFactor <= minZoomFactor) {
    return;
  }

  mainWindow.webContents.zoomFactor -= zoomStep;

  if (mainWindow.webContents.zoomFactor <= minZoomFactor) {
    menuInstance.getMenuItemById('MENU_ZOOM_OUT').enabled = false;
  }
};

export const handleZoomReset = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  menuInstance.getMenuItemById('MENU_ZOOM_IN').enabled = true;
  menuInstance.getMenuItemById('MENU_ZOOM_OUT').enabled = true;

  mainWindow.webContents.zoomFactor = defaultZoomFactor;
};
