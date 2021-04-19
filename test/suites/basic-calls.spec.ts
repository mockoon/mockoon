import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const testCases: HttpCall[] = [
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

  it('Start default environment', async () => {
    await tests.helpers.startEnvironment();
  });

  for (const testCase of testCases) {
    it(testCase.description, async () => {
      await tests.helpers.httpCallAsserter(testCase);
    });
  }
});

describe('Basic endpoint calls with prefix', () => {
  const tests = new Tests('basic-data');
  const prefixInputSelector = 'input[formcontrolname=endpointPrefix]';
  const testCase: HttpCall = {
    path: '/api/answer',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: '42'
    }
  };
  it('should call endpoint successfully with simple prefix', async () => {
    await tests.helpers.setElementValue(prefixInputSelector, 'api');
    await tests.helpers.startEnvironment();
    await tests.helpers.httpCallAsserter(testCase);
  });

  it('should call endpoint successfully with prefix with a trailing slash', async () => {
    await tests.helpers.setElementValue(prefixInputSelector, 'api/');
    await tests.helpers.restartEnvironment();
    await tests.helpers.httpCallAsserter(testCase);
  });
});
