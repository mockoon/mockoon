import { Options } from '@wdio/types';
import { config as defaultConfig } from './wdio-common.conf';

const config: Options.Testrunner = {
  ...defaultConfig,
  specs: ['./tools/documentation.spec.ts']
};

export { config };
