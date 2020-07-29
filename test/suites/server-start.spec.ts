import { Tests } from 'test/lib/tests';

describe('Environment start/stop/restart', () => {
  const tests = new Tests('basic-data');
  tests.runHooks();

  it('Start default selected environment', async () => {
    await tests.helpers.startEnvironment();
  });

  it('Stop default selected environment', async () => {
    await tests.helpers.stopEnvironment();
  });
});
