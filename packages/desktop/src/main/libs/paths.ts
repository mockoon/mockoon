import { app, shell } from 'electron';
import { join as pathJoin, resolve as pathResolve } from 'path';

declare const IS_TESTING: boolean;
declare const IS_DEV: boolean;

export const setPaths = () => {
  // set local data folder when in dev mode or running tests
  if (IS_TESTING || IS_DEV) {
    const tmpFolder = pathResolve('./tmp');

    app.setPath('userData', tmpFolder);
    app.setAppLogsPath(pathJoin(tmpFolder, '/logs'));

    return;
  }

  // set data folder when is portable mode
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    const portableDataDir = pathJoin(
      process.env.PORTABLE_EXECUTABLE_DIR,
      'mockoon-data'
    );

    app.setPath('userData', portableDataDir);
    app.setAppLogsPath(pathJoin(portableDataDir, '/logs'));

    return;
  }

  // set data folder when inside a snap package (default folder get wiped on snap updates)
  if (process.platform === 'linux' && process.env.SNAP) {
    app.setPath('userData', pathJoin(process.env.SNAP_USER_COMMON));
    app.setAppLogsPath();

    return;
  }

  // create default logs folder (https://www.electronjs.org/docs/latest/api/app#appsetapplogspathpath)
  app.setAppLogsPath();
};

export const showFolderInExplorer = (
  name: Parameters<typeof app.getPath>[0]
) => {
  shell.showItemInFolder(app.getPath(name));
};
