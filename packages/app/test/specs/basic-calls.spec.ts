import environments from '../libs/environments';
import environmentsSettings from '../libs/environments-settings';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';

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

const prefixTestCase: HttpCall = {
  path: '/api/answer',
  method: 'GET',
  testedResponse: {
    status: 200,
    body: '42'
  }
};

describe('Basic endpoint calls', () => {
  it('should open and start the environment', async () => {
    await environments.open('basic-data');
    await environments.start();
  });

  for (const testCase of testCases) {
    it(testCase.description, async () => {
      await http.assertCall(testCase);
    });
  }
});

describe('Basic endpoint calls with prefix', () => {
  it('should call endpoint successfully with simple prefix', async () => {
    await navigation.switchView('ENV_SETTINGS');
    await environmentsSettings.setSettingValue('endpointPrefix', 'api');
    await environments.restart();
    await http.assertCall(prefixTestCase);
  });

  it('should call endpoint successfully with prefix with a trailing slash', async () => {
    await environmentsSettings.setSettingValue('endpointPrefix', 'api/');
    await environments.restart();
    await http.assertCall(prefixTestCase);
  });
});
