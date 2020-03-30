import { Tests } from 'test/lib/tests';

const tests = new Tests('basic-data');

describe('Environment start/stop/restart', () => {
  tests.runHooks();

  it('Start default selected environment', async () => {
    await tests.helpers.startEnvironment();
  });

  it('Stop default selected environment', async () => {
    await tests.helpers.stopEnvironment();
  });
});
