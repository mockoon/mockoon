import { Options } from '@wdio/types';
import { config as defaultConfig } from './wdio.conf';

const config: Options.Testrunner = {
  ...defaultConfig,
  specs: ['./tools/documentation.spec.ts']
};

export { config };
