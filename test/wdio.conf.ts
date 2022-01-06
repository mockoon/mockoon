import { join } from 'path';
import bootstrap from './libs/bootstrap';

export const config: WebdriverIO.Config = {
  specs: ['./test/specs/**/*.spec.ts'],
  exclude: [],
  maxInstances: 1,
  logLevel: 'warn',
  capabilities: [
    {
      maxInstances: 1,
      browserName: 'chrome',
      'goog:chromeOptions': {
        binary: join(
          process.cwd(),
          `./node_modules/.bin/electron${
            process.platform === 'win32' ? '.cmd' : ''
          }`
        ), // electron packaged binary
        /* binary: path.join(
          process.cwd(),
          'packages',
          'win-unpacked',
          'Mockoon.exe'
        ), */
        args: [
          // app= if using electron from node_modules
          'app=' + join(process.cwd(), './dist/app.js'),
          'user-data-dir=' + join(process.cwd(), 'tmp'),
          '--remote-debugging-port=9222'
        ]
      },
      acceptInsecureCerts: true
    }
  ],
  beforeSession: async (cap, spec, browser) => {
    await bootstrap.init();
  },
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ['chromedriver'],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  }
};
