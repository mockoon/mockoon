import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Environment start/stop/restart', () => {
  tests.runHooks();

  tests.waitForWindowReady();
  tests.waitForEnvironmentLoaded();

  it('Start default selected environment', async () => {
    await tests.spectron.client.element('.btn i[ngbtooltip="Start server"]').click().pause(500);
    await tests.spectron.client.isExisting('.nav-item .nav-link.running').should.eventually.equal(true);
  });

  it('Stop default selected environment', async () => {
    await tests.spectron.client.element('.btn i[ngbtooltip="Stop server"]').click().pause(500);
    await tests.spectron.client.isExisting('.nav-item .nav-link.running').should.eventually.equal(false);
  });
});
