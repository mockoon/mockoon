import { BrowserWindow, Menu } from 'electron';

const defaultZoomFactor = 1;
const maxZoomFactor = 1.6;
const minZoomFactor = 0.8;
const zoomStep = 0.1;

export const handleZoomIn = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  const menuItemZoomIn = menuInstance?.getMenuItemById('MENU_ZOOM_IN');
  const menuItemZoomOut = menuInstance?.getMenuItemById('MENU_ZOOM_OUT');

  if (menuItemZoomOut) {
    menuItemZoomOut.enabled = true;
  }

  if (mainWindow.webContents.zoomFactor >= maxZoomFactor) {
    return;
  }

  mainWindow.webContents.zoomFactor += zoomStep;

  if (mainWindow.webContents.zoomFactor >= maxZoomFactor && menuItemZoomIn) {
    menuItemZoomIn.enabled = false;
  }
};

export const handleZoomOut = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  const menuItemZoomIn = menuInstance?.getMenuItemById('MENU_ZOOM_IN');
  const menuItemZoomOut = menuInstance?.getMenuItemById('MENU_ZOOM_OUT');

  if (menuItemZoomIn) {
    menuItemZoomIn.enabled = true;
  }

  if (mainWindow.webContents.zoomFactor <= minZoomFactor) {
    return;
  }

  mainWindow.webContents.zoomFactor -= zoomStep;

  if (mainWindow.webContents.zoomFactor <= minZoomFactor && menuItemZoomOut) {
    menuItemZoomOut.enabled = false;
  }
};

export const handleZoomReset = (mainWindow: BrowserWindow) => {
  const menuInstance = Menu.getApplicationMenu();
  const menuItemZoomIn = menuInstance?.getMenuItemById('MENU_ZOOM_IN');
  const menuItemZoomOut = menuInstance?.getMenuItemById('MENU_ZOOM_OUT');

  if (menuItemZoomIn) {
    menuItemZoomIn.enabled = true;
  }

  if (menuItemZoomOut) {
    menuItemZoomOut.enabled = true;
  }

  mainWindow.webContents.zoomFactor = defaultZoomFactor;
};
