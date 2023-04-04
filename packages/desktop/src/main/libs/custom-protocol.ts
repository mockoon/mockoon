import { app, BrowserWindow } from 'electron';
import { info as logInfo } from 'electron-log';
import { parse as qsParse } from 'querystring';
import { ProtocolAction } from 'src/shared/models/protocol.model';

const validActions: ProtocolAction[] = ['load-environment', 'load-export-data'];

export const registerProtocol = () => {
  /**
   * Not registering the protocol on Linux until HTML file association is fixed
   * See: https://github.com/mockoon/mockoon/issues/977
   */
  if (process.platform === 'linux') {
    return;
  }

  app.setAsDefaultProtocolClient('mockoon');
};

export const parseProtocolArgs = (
  args: string[],
  mainWindow: BrowserWindow
) => {
  const target = args
    .find((arg) => arg.startsWith('mockoon://'))
    ?.split('mockoon://')[1];

  if (target) {
    // split action and query params. A trailing slash may be added between the action and the query params (action/?param=value)
    const parts = target.match(/^([a-z\-]*)\/?\?(.*)/);

    if (parts) {
      const action = parts[1] as ProtocolAction;
      const parameters = qsParse(parts[2]);

      if (!validActions.includes(action)) {
        return;
      }

      logInfo(`[MAIN]Custom protocol received ${target}`);

      mainWindow.webContents.send('APP_CUSTOM_PROTOCOL', action, parameters);
    }
  }
};
