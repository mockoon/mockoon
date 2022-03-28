import { join } from 'path';
import { config as defaultConfig } from './wdio.conf';

const config: WebdriverIO.Config = {
  ...defaultConfig,
  specs: ['./test/specs/packaged.spec.ts'],
  capabilities: [
    {
      maxInstances: 1,
      browserName: 'chrome',
      'goog:chromeOptions': {
        binary: join(process.cwd(), 'packages', 'linux-unpacked', 'mockoon'),
        args: ['--remote-debugging-port=9222']
      },
      acceptInsecureCerts: true
    }
  ]
};

export { config };
