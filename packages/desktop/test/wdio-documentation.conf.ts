import { config as defaultConfig } from './wdio.conf';

const config: WebdriverIO.Config = {
  ...defaultConfig,
  specs: ['./test/tools/documentation.spec.ts']
};

export { config };
