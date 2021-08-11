import { watch } from 'chokidar';
import { app, BrowserWindow } from 'electron';
import { basename } from 'path';

export const hotReload = (mainWindow: BrowserWindow) => {
  let relaunching = false;

  const watcher = watch(__dirname, { ignored: '**/*.map' });

  app.on('quit', () => {
    watcher.close();
  });

  watcher.on('change', (path) => {
    if (['app.js', 'preload.js'].includes(basename(path))) {
      if (!relaunching) {
        app.relaunch();
        app.exit(0);
        relaunching = true;
      }
    } else {
      setTimeout(() => {
        mainWindow.webContents.reloadIgnoringCache();
      }, 500);
    }
  });
};
