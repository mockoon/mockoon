import { Options } from '@wdio/types';
import { join } from 'path';
import { config as commonConfig } from './wdio-common.conf';

const config: Options.Testrunner = {
  ...commonConfig,
  capabilities: [
    {
      browserName: 'electron',
      'wdio:electronServiceOptions': {
        appBinaryPath: join(
          process.cwd(),
          'packages',
          'linux-unpacked',
          'mockoon'
        ),
        appArgs: ['user-data-dir=' + join(process.cwd(), 'tmp')]
      }
    }
  ]
};

export { config };
