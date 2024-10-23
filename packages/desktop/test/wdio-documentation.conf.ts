import { promises as fs } from 'fs';
import { config as commonConfig } from './wdio-common.conf';
import { config as winConfig } from './wdio-win.conf';

const config: WebdriverIO.Config = {
  ...winConfig,
  specs: ['./tools/documentation.spec.ts'],
  beforeSession: [
    commonConfig.beforeSession as any,
    async () => {
      // wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await fs.mkdir('./tmp/docs');
      await fs.writeFile(
        './tmp/window-state.json',
        JSON.stringify({
          width: 1500,
          height: 1024,
          x: 150,
          y: 150,
          isMaximized: false,
          isFullScreen: false,
          displayBounds: { x: 0, y: 0, width: 2560, height: 1440 }
        })
      );

      await fs.writeFile(
        './tmp/storage/settings.json',
        JSON.stringify({
          welcomeShown: true,
          bannerDismissed: [],
          maxLogsPerEnvironment: 50,
          truncateRouteName: true,
          mainMenuSize: 150,
          secondaryMenuSize: 200,
          fakerLocale: 'en',
          fakerSeed: null,
          lastChangelog: '9999.9.9',
          environments: [],
          enableTelemetry: true,
          storagePrettyPrint: true,
          startEnvironmentsOnLoad: false,
          logTransactions: false,
          disabledRoutes: {},
          collapsedFolders: {}
        })
      );
    }
  ]
};

export { config };
