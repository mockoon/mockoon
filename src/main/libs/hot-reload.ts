import { watch } from 'chokidar';
import { app } from 'electron';

export const hotReload = () => {
  let relaunching = false;

  const watcher = watch(__dirname, { ignored: '**/*.map' });

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
