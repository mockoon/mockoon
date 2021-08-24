import { app, BrowserWindow } from 'electron';
import { info as logInfo } from 'electron-log';
import { parse } from 'querystring';

// mockoon://{action}?{param=value}&{}....
// parser les params avec qs dans commons-server
const validActions: string[] = ['load-export-data'];

export const registerProtocol = () => {
  app.setAsDefaultProtocolClient('mockoon');
};

export const parseProtocolArgs = (
  args: string[],
  mainWindow: BrowserWindow
) => {
  const target = args
    .find((arg) => arg.startsWith('mockoon://'))
    ?.split('://')[1];
  logInfo('extracted arg ' + target);
  if (target) {
    const action = target.split('?')[0];
    const parameters = parse(target.split('?')[1]);

    if (!validActions.includes(action)) {
      return;
    }
    mainWindow.webContents.send('APP_UPDATE_AVAILABLE', action, parameters);
  }
};
