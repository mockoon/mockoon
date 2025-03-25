import { BrowserWindow } from 'electron';

export const createSplashScreen = () => {
  const splashScreen = new BrowserWindow({
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
    skipTaskbar: true,
    backgroundColor: '#3C637C'
  });

  splashScreen.loadURL(`file://${__dirname}/renderer/splashscreen.html`);

  splashScreen.on('closed', () => {
    splashScreen.destroy();
  });

  splashScreen.once('ready-to-show', () => {
    splashScreen.show();
  });

  return splashScreen;
};
