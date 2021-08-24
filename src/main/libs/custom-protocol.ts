import { app } from 'electron';
import { info as logInfo } from 'electron-log';

export const registerProtocol = () => {
  app.setAsDefaultProtocolClient('mockoon');
};

export const parseProtocolArgs = (args: string[]): string | undefined => {
  const target = args
    .find((arg) => arg.startsWith('mockoon://'))
    ?.split('://')[1];

  logInfo('extracted arg ' + target);

  return target;
};
