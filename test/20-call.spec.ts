import { fetch } from './lib/fetch';
import { Tests } from './lib/tests';

const tests = new Tests('basic-data');

describe('Basic endpoint calls', () => {
  tests.runHooks();

  it('Start default environment', async () => {
    await tests.spectron.client.element('.btn i[ngbtooltip="Start server"]').click().pause(100);
  });

  it('Call "answer" route', async () => {
    await fetch({ protocol: 'http', port: 3000, path: '/answer', method: 'get' }).should.eventually.equal('42');
  });

  it('Call "regex" route', async () => {
    const cases = [
      {
        path: '/abc/testvar/ac/1234', response: '{"response":"testvar"}'
      },
      {
        path: '/ac/hello/abc/0', response: '{"response":"hello"}'
      }
    ];

    for (let index = 0; index < cases.length; index++) {
      await fetch({ protocol: 'http', port: 3000, path: cases[index].path, method: 'get' }).should.eventually.equal(cases[index].response);
    }
  });
});
