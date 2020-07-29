import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const cases: HttpCall[] = [
  {
    description: 'Call GET /answer',
    path: '/answer',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: '42'
    }
  },
  {
    description: 'Call GET /abc/testvar/ac/1234',
    path: '/abc/testvar/ac/1234',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: '{"response": "testvar"}'
    }
  },
  {
    description: 'Call GET /ac/hello/abc/0',
    path: '/ac/hello/abc/0',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: '{"response": "hello"}'
    }
  },
  {
    description: 'Call POST /dolphins',
    path: '/dolphins',
    method: 'POST',
    testedResponse: {
      status: 200,
      body: '{\n    "response": "So Long, and Thanks for All the Fish"\n}'
    }
  }
];

describe('Basic endpoint calls', () => {
  const tests = new Tests('basic-data');
  tests.runHooks();

  it('Start default environment', async () => {
    await tests.helpers.startEnvironment();
  });

  for (let index = 0; index < cases.length; index++) {
    it(cases[index].description, async () => {
      await tests.helpers.httpCallAsserter(cases[index]);
    });
  }
});
