import environments from '../libs/environments';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import routes from '../libs/routes';

const testCases: HttpCall[] = [
  {
    description:
      'should call the GET test endpoint without Authorization header and get the fallback route error',
    path: '/test',
    method: 'GET',
    testedResponse: {
      status: 403,
      body: 'unauthorized'
    }
  },
  {
    description:
      'should call the POST test endpoint without Authorization header and get the fallback route error',
    path: '/test',
    method: 'POST',
    testedResponse: {
      status: 403,
      body: 'unauthorized'
    }
  },
  {
    description:
      'should call the GET test endpoint with an Authorization header and get the route response',
    path: '/test',
    method: 'GET',
    headers: { Authorization: 'Bearer abc' },
    testedResponse: {
      status: 200,
      body: 'okget'
    }
  },
  {
    description:
      'should call the POST test endpoint with an Authorization header and get the route response',
    path: '/test',
    method: 'POST',
    headers: { Authorization: 'Bearer abc' },
    testedResponse: {
      status: 200,
      body: 'okpost'
    }
  }
];

describe('Global routes and rules', () => {
  it('should open and run the environment', async () => {
    await environments.open('global-route');
    await environments.start();
  });

  it('should verify the method displayed in the menu', async () => {
    await routes.select(1);
    await routes.assertMenuEntryText(1, 'ALL');
  });

  for (const testCase of testCases) {
    it(testCase.description, async () => {
      await http.assertCall(testCase);
    });
  }
});
