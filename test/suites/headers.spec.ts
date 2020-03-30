import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const tests = new Tests('headers');

const getHeaders: HttpCall = {
  description: 'Call GET headers',
  path: '/headers',
  method: 'GET',
  testedResponse: {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'route-header': 'route-header',
      'global-header': 'global-header'
    }
  }
};

const getDoNotExists: HttpCall = {
  description: 'Call GET donotexists',
  path: '/donotexists',
  method: 'GET',
  testedResponse: {
    status: 404,
    headers: {
      'global-header': 'global-header'
    }
  }
};

describe('Headers a', () => {
  tests.runHooks();

  it('Call /headers, route header should override global headers', async () => {
    await tests.helpers.startEnvironment();
    await tests.helpers.httpCallAsserterWithPort(getHeaders, 3000);
  });

  it('Call /donotexists should return a 404 with global headers', async () => {
    await tests.helpers.httpCallAsserterWithPort(getDoNotExists, 3000);
  });
});
