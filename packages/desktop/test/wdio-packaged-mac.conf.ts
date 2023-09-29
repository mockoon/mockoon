import { Options } from '@wdio/types';
import { join } from 'path';
import { config as defaultConfig } from './wdio.conf';

const config: Options.Testrunner = {
  ...defaultConfig,
  specs: ['./specs/packaged.spec.ts'],
  capabilities: [
    {
      maxInstances: 1,
      browserName: 'chrome',
      browserVersion: '116',
      'goog:chromeOptions': {
        binary: join(
          process.cwd(),
          'packages',
          'mac-universal',
          'Mockoon.app',
          'Contents',
          'MacOS',
          'Mockoon'
        ),
        args: ['--remote-debugging-port=9222']
      },
      acceptInsecureCerts: true
    }
  ]
};

export { config };
