import { createLoggerInstance } from '@mockoon/commons-server';
import { app } from 'electron';
import { join as pathJoin } from 'path';

let _mainLogger: ReturnType<typeof createLoggerInstance>;

export const createMainLogger = () => {
  _mainLogger = createLoggerInstance({
    filename: pathJoin(app.getPath('logs'), 'app.log')
  });
};

export const mainLogger = () => _mainLogger;

export const logInfo = (message: string, payload?: any) => {
  mainLogger().info(message, {
    app: 'mockoon-desktop',
    ...payload
  });
};

export const logError = (message: string, payload?: any) => {
  mainLogger().error(message, {
    app: 'mockoon-desktop',
    ...payload
  });
};
