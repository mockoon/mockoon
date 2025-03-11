import { join } from 'path';
import { config as commonConfig } from './wdio-common.conf';

const config: WebdriverIO.Config = {
  ...commonConfig,
  capabilities: [
    {
      browserName: 'electron',
      'wdio:electronServiceOptions': {
        appBinaryPath: join(
          process.cwd(),
          'packages',
          'mac',
          'Mockoon.app',
          'Contents',
          'MacOS',
          'Mockoon'
        ),
        appArgs: ['user-data-dir=' + join(process.cwd(), 'tmp')]
      }
    }
  ]
};

export { config };
