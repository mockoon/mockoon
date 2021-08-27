import { app, BrowserWindow } from 'electron';
import { parse } from 'querystring';

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
    ?.split('mockoon://')[1];

  if (target) {
    const parts = target.match(/^([a-z\-]*)\/?\?(.*)/);

    if (parts) {
      const action = parts[1];
      const parameters = parse(parts[2]);

      if (!validActions.includes(action)) {
        return;
      }
      mainWindow.webContents.send('APP_CUSTOM_PROTOCOL', action, parameters);
    }
  }
};
