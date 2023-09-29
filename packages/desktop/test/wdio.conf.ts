import { Options } from '@wdio/types';
import { join } from 'path';
import bootstrap from './libs/bootstrap';

export const config: Options.Testrunner = {
  specs: ['./specs/**/*.spec.ts'],
  exclude: [],
  maxInstances: 1,
  logLevel: 'warn',
  runner: 'local',
  capabilities: [
    {
      maxInstances: 1,
      browserName: 'chrome',
      browserVersion: '116',
      'goog:chromeOptions': {
        binary: join(
          process.cwd(),
          `./node_modules/.bin/electron${
            process.platform === 'win32' ? '.cmd' : ''
          }`
        ),
        args: [
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
