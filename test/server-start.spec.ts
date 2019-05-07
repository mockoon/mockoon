import { startEnvironment } from './lib/common';
import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Environment start/stop/restart', () => {
  tests.runHooks();

  it('Start default selected environment', async () => {
    await startEnvironment(tests);
  });

  it('Stop default selected environment', async () => {
    await tests.spectron.client.element('.btn i[ngbtooltip="Stop server"]').click();
    await tests.spectron.client.waitForExist('.menu-column--environments .menu-list .nav-item .nav-link.running', 5000, true);
  });
});
