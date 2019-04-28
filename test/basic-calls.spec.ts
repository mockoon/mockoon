import { fetch } from './lib/fetch';
import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

const cases: { path: string, method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'OPTIONS', body: string }[] = [
  {
    path: '/answer', method: 'GET', body: '42'
  },
  {
    path: '/abc/testvar/ac/1234', method: 'GET', body: '{"response":"testvar"}'
  },
  {
    path: '/ac/hello/abc/0', method: 'GET', body: '{"response":"hello"}'
  },
  {
    path: '/dolphins', method: 'POST', body: '{"response":"So Long, and Thanks for All the Fish"}'
  }
];

describe('Basic endpoint calls', () => {
  tests.runHooks();

  tests.waitForWindowReady();
  tests.waitForEnvironmentLoaded();

  it('Start default environment', async () => {
    await tests.spectron.client.element('.btn i[ngbtooltip="Start server"]').click().pause(100);
  });

  for (let index = 0; index < cases.length; index++) {
    it(`Call ${cases[index].method.toUpperCase()} ${cases[index].path} route`, async () => {
      await fetch({
        protocol: 'http',
        port: 3000,
        path: cases[index].path,
        method: cases[index].method
      }).should.eventually.deep.include({ body: cases[index].body });
    });
  }
});
