import { watch } from 'chokidar4';
import { app } from 'electron';
import { resolve } from 'path';

export const hotReload = () => {
  let relaunching = false;

  const watcher = watch(
    [
      __dirname,
      resolve('../cloud/dist'),
      resolve('../commons/dist'),
      resolve('../commons-server/dist')
    ],
    {
      ignored: (path, stats) => !!stats?.isFile() && !path.endsWith('.js'),
      interval: 3000
    }
  );

  app.on('quit', () => {
    watcher.close();
  });

  watcher.on('change', () => {
    if (!relaunching) {
      app.relaunch();
      app.exit(0);
      relaunching = true;
    }
  });
};
