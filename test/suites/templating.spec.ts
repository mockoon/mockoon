import { format as dateFormat } from 'date-fns';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const cases: HttpCall[] = [
  {
    description: 'Helper: body (application/json)',
    path: '/bodyjson',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: { test: { paths: [{ item: 'testitem' }] } },
    testedResponse: {
      status: 200,
      body: 'testitem'
    }
  },
  {
    description: 'Helper: body (application/json) (default value)',
    path: '/bodyjson',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: { test: { paths: [{ item1: 'testitem' }] } },
    testedResponse: {
      status: 200,
      body: 'defaultitem'
    }
  },
  {
    description: 'Helper: body (application/x-www-form-urlencoded)',
    path: '/bodyform',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: { param1: 'testparam1' },
    testedResponse: {
      status: 200,
      body: 'testparam1'
    }
  },
  {
    description: 'Helper: urlParam',
    path: '/urlparam/testurlparam1',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'testurlparam1'
    }
  },
  {
    description: 'Helper: queryParam',
    path: '/queryparam?queryparam1=testqueryparam1',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'testqueryparam1'
    }
  },
  {
    description: 'Helper: queryParam (default value)',
    path: '/queryparam?queryparam2=testqueryparam2',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'defaultqueryparam'
    }
  },
  {
    description: 'Helper: header',
    path: '/header',
    headers: { header1: 'testheader1' },
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'testheader1'
    }
  },
  {
    description: 'Helper: header (default value)',
    path: '/header',
    headers: { header2: 'testheader2' },
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'defaultheader'
    }
  },
  {
    description: 'Helper: cookie',
    path: '/cookie',
    method: 'GET',
    cookie: 'cookie1=testcookie1',
    testedResponse: {
      status: 200,
      body: 'testcookie1'
    }
  },
  {
    description: 'Helper: cookie (default value)',
    path: '/cookie',
    method: 'GET',
    cookie: 'cookie2=testcookie2',
    testedResponse: {
      status: 200,
      body: 'defaultcookie'
    }
  },
  {
    description: 'Helper: hostname',
    path: '/hostname',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'localhost'
    }
  },
  {
    description: 'Helper: ip',
    path: '/ip',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: '::ffff:127.0.0.1'
    }
  },
  {
    description: 'Helper: method',
    path: '/method',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'GET'
    }
  },
  {
    description: 'Helper: oneOf',
    path: '/oneof',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'testitem1'
    }
  },
  {
    description: 'Helper: someOf',
    path: '/someof',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'testitem,testitem'
    }
  },
  {
    description: 'Helper: someOf (as array)',
    path: '/someofarray',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: '[&quot;testitem&quot;,&quot;testitem&quot;]'
    }
  },
  {
    description: 'Helper: now',
    path: '/now',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: dateFormat(new Date(), 'YYYY-MM-DD', {
        useAdditionalWeekYearTokens: true,
        useAdditionalDayOfYearTokens: true
      })
    }
  }
];

describe('Templating', () => {
  const tests = new Tests('templating');
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
