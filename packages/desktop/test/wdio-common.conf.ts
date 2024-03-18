import { Options } from '@wdio/types';
import bootstrap from './libs/bootstrap';

export const config: Partial<Options.Testrunner> = {
  specs: ['./specs/**/*.spec.ts'],
  exclude: [],
  maxInstances: 1,
  logLevel: 'warn',
  runner: 'local',
  services: ['electron'],
  beforeSession: async (cap, spec, browser) => {
    await bootstrap.init();
  },
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  }
};
