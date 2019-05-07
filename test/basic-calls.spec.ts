import { httpCallAsserter, startEnvironment } from './lib/common';
import { Tests } from './lib/tests';
import { HttpCall } from './lib/types';

const tests = new Tests('basic-data');

const cases: HttpCall[] = [
  {
    description: 'Call GET /answer',
    path: '/answer',
    method: 'GET',
    testedProperties: {
      status: 200,
      body: '42'
    }
  },
  {
    description: 'Call GET /abc/testvar/ac/1234',
    path: '/abc/testvar/ac/1234',
    method: 'GET',
    testedProperties: {
      status: 200,
      body: '{"response":"testvar"}'
    }
  },
  {
    description: 'Call GET /ac/hello/abc/0',
    path: '/ac/hello/abc/0',
    method: 'GET',
    testedProperties: {
      status: 200,
      body: '{"response":"hello"}'
    }
  },
  {
    description: 'Call POST /dolphins',
    path: '/dolphins',
    method: 'POST',
    testedProperties: {
      status: 200,
      body: '{"response":"So Long, and Thanks for All the Fish"}'
    }
  }
];

describe('Basic endpoint calls', () => {
  tests.runHooks();

  it('Start default environment', async () => {
    await startEnvironment(tests);
  });

  for (let index = 0; index < cases.length; index++) {
    it(cases[index].description, async () => {
      await httpCallAsserter(cases[index], tests);
    });
  }
});
