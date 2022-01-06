import environments from '../libs/environments';
import file from '../libs/file';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import routes from '../libs/routes';
import utils from '../libs/utils';

describe('Responses rules', () => {
  describe('Create, update, delete and test basic rules', async () => {
    it('should open and start the environment', async () => {
      await environments.open('response-rules');
      await environments.start();
    });

    it('should add a route response with status 200', async () => {
      await routes.select(1);
      await routes.assertCountRouteResponses(1);
      await routes.addRouteResponse();
      await routes.assertCountRouteResponses(2);
    });

    it('should route with multiple responses and no rules defined should return the first response', async () => {
      await utils.waitForAutosave();
      await http.assertCall({
        path: '/users/1',
        method: 'GET',
        testedResponse: {
          status: 500
        }
      });
    });

    it('should add a url params rule to response 200, if fulfilled should return 200', async () => {
      await routes.selectRouteResponse(2);
      await routes.switchTab('RULES');
      await routes.addResponseRule({
        modifier: 'userid',
        target: 'params',
        value: '10',
        operator: 'equals'
      });

      await utils.waitForAutosave();

      await http.assertCall({
        path: '/users/10',
        method: 'GET',
        testedResponse: {
          status: 200
        }
      });
    });

    it('should add a query string rule to response 500, both routes rules can be fulfilled but returns 500', async () => {
      await routes.selectRouteResponse(1);
      await routes.switchTab('RULES');
      await routes.addResponseRule({
        modifier: 'userid',
        target: 'query',
        value: '5',
        operator: 'equals'
      });

      await utils.waitForAutosave();

      await http.assertCall({
        path: '/users/10?userid=5',
        method: 'GET',
        testedResponse: {
          status: 500
        }
      });
    });

    it('should add a header rule to response 500, test rule', async () => {
      await routes.switchTab('RULES');
      await routes.addResponseRule({
        modifier: 'Accept',
        target: 'header',
        value: 'application/xhtml+xml',
        operator: 'equals'
      });

      await utils.waitForAutosave();

      await http.assertCall({
        path: '/users/1234',
        headers: { Accept: 'application/xhtml+xml' },
        method: 'GET',
        testedResponse: {
          status: 500
        }
      });
    });

    it('should delete a route response', async () => {
      await routes.assertCountRouteResponses(2);
      await routes.removeRouteResponse();
      await routes.assertCountRouteResponses(1);
    });
  });

  describe('Test advanced rules', async () => {
    const testCases: HttpCall[] = [
      {
        description: 'Query string object with regex',
        path: '/rules/query?obj[prop1]=value1&obj[prop2]=value2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '1'
        }
      },
      {
        description: 'Query string array with regex',
        path: '/rules/query?array[]=test1&array[]=test2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '2'
        }
      },
      {
        description: 'Route param with regex',
        path: '/rules/100',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '3'
        }
      },
      {
        description: 'Header Accept-Charset without regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Accept-Charset': 'UTF-8'
        },
        testedResponse: {
          status: 200,
          body: '4'
        }
      },
      {
        description: 'Header Accept-Charset with regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Accept-Charset': 'UTF-16'
        },
        testedResponse: {
          status: 200,
          body: '5'
        }
      },
      {
        description: 'Body property without regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { name: 'john' },
        testedResponse: {
          status: 200,
          body: '6'
        }
      },
      {
        description: 'Body path to property without regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { user: [{ name: 'John' }] },
        testedResponse: {
          status: 200,
          body: '7'
        }
      },
      {
        description: 'Body path to array without regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { users: ['John', 'Johnny', 'Paul'] },
        testedResponse: {
          status: 200,
          body: '8'
        }
      },
      {
        description: 'Body property with regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { user: 'Richard' },
        testedResponse: {
          status: 200,
          body: '9'
        }
      },
      {
        description: 'Body path to non existing property with regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {},
        testedResponse: {
          status: 404,
          body: '0'
        }
      },
      {
        description: 'Body path to array with regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { users: ['Bob', 'Rick', 'Richard'] },
        testedResponse: {
          status: 200,
          body: '10'
        }
      },
      {
        description: 'Body path when Content-Type contains more info (charset)',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        },
        body: { test: 'test' },
        testedResponse: {
          status: 200,
          body: '11'
        }
      },
      {
        description: 'Body path to number, without regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { test: 1 },
        testedResponse: {
          status: 200,
          body: '12'
        }
      },
      {
        description: 'Body path to boolean, without regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { test: true },
        testedResponse: {
          status: 200,
          body: '13'
        }
      },
      {
        description: 'Full body without regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'testfullbody',
        testedResponse: {
          status: 200,
          body: '14'
        }
      },
      {
        description: 'Full body with regex',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'testfullbody2',
        testedResponse: {
          status: 200,
          body: '15'
        }
      },
      {
        description: 'Body path to null value',
        path: '/rules/2',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { property1: null },
        testedResponse: {
          status: 200,
          body: '16'
        }
      }
    ];

    for (const testCase of testCases) {
      it(testCase.description, async () => {
        await http.assertCall(testCase);
      });
    }
  });

  describe('Rules operator', async () => {
    const testCases: HttpCall[] = [
      {
        description: 'Call fulfill 2nd response OR first rule',
        path: '/operator/param1value?qp1=qp99value',
        method: 'GET',
        testedResponse: {
          status: 201,
          body: 'rulesOperatorOR'
        }
      },
      {
        description: 'Call fulfill 2nd response OR second rule',
        path: '/operator/param99value?qp1=qp1value',
        method: 'GET',
        testedResponse: {
          status: 201,
          body: 'rulesOperatorOR'
        }
      },
      {
        description: 'Call fulfill 2nd response OR both rules',
        path: '/operator/param1value?qp1=qp1value',
        method: 'GET',
        testedResponse: {
          status: 201,
          body: 'rulesOperatorOR'
        }
      },
      {
        description: 'Call do not fulfill 2nd response OR rules',
        path: '/operator/param99value?qp1=qp99value',
        method: 'GET',
        testedResponse: {
          status: 500,
          body: 'error'
        }
      },
      {
        description: 'Call fulfill 3rd response AND rules',
        path: '/operator/param1value2?qp2=qp2value&qp3=qp3value',
        method: 'GET',
        testedResponse: {
          status: 202,
          body: 'rulesOperatorAND'
        }
      },
      {
        description: 'Call do not fulfill 3rd response AND rules',
        path: '/operator/param1value2?qp2=qp2value&qp3=qp99value',
        method: 'GET',
        testedResponse: {
          status: 500,
          body: 'error'
        }
      }
    ];

    it('should add 2 OR rules on response 2, verify operator switch presence', async () => {
      await routes.select(3);
      await routes.selectRouteResponse(2);
      await routes.switchTab('RULES');
      await routes.addResponseRule({
        modifier: 'param1',
        target: 'params',
        value: 'param1value',
        operator: 'equals'
      });
      await routes.assertRulesOperatorPresence(true);
      await routes.addResponseRule({
        modifier: 'qp1',
        target: 'query',
        value: 'qp1value',
        operator: 'equals'
      });
      await routes.assertRulesOperatorPresence();
      await routes.assertRulesOperator('OR');
    });

    it('should add 3 AND rules on response 3, verify operator switch presence', async () => {
      await routes.selectRouteResponse(3);
      await routes.switchTab('RULES');
      await routes.addResponseRule({
        modifier: 'param1',
        target: 'params',
        value: 'param1value2',
        operator: 'equals'
      });
      await routes.addResponseRule({
        modifier: 'qp2',
        target: 'query',
        value: 'qp2value',
        operator: 'equals'
      });
      await routes.addResponseRule({
        modifier: 'qp3',
        target: 'query',
        value: 'qp3value',
        operator: 'equals'
      });
      await routes.assertRulesOperatorPresence();
      await routes.assertRulesOperator('OR');
      await routes.selectRulesOperator('AND');
      await routes.assertRulesOperator('AND');
      await utils.waitForAutosave();
    });

    for (const testCase of testCases) {
      it(testCase.description, async () => {
        await http.assertCall(testCase);
      });
    }
  });

  describe('Random responses', async () => {
    const testCase: HttpCall = {
      description: 'Call the random response endpoint',
      path: '/random-sequential',
      method: 'GET'
    };
    const statuses = [];

    it('should enable random responses', async () => {
      await routes.select(4);
      await routes.toggleRouteResponseRandom();
      await utils.waitForAutosave();
    });

    it('should call the random endpoint 20 times and have at least one of each statuses', async () => {
      for (let calls = 0; calls < 20; calls++) {
        const response = await http.assertCall(testCase);

        statuses.push(response.status);
      }

      expect(statuses).toContain(201);
      expect(statuses).toContain(202);
      expect(statuses).toContain(204);
    });
  });

  describe('Sequential responses', async () => {
    const testCases: HttpCall[] = [
      {
        description:
          'should call the sequential responses endpoint and get a 201',
        path: '/random-sequential',
        method: 'GET',
        testedResponse: { status: 201 }
      },
      {
        description:
          'should call the sequential responses endpoint and get a 202',
        path: '/random-sequential',
        method: 'GET',
        testedResponse: { status: 202 }
      },
      {
        description:
          'should call the sequential responses endpoint and get a 204',
        path: '/random-sequential',
        method: 'GET',
        testedResponse: { status: 204 }
      },
      {
        description:
          'should call the sequential responses endpoint and get a 201',
        path: '/random-sequential',
        method: 'GET',
        testedResponse: { status: 201 }
      },
      {
        description:
          'should call the sequential responses endpoint and get a 202',
        path: '/random-sequential',
        method: 'GET',
        testedResponse: { status: 202 }
      }
    ];

    it('should restart the environment', async () => {
      await environments.stop();
      await environments.start();
    });

    it('should enable random responses', async () => {
      await routes.select(4);
      await routes.toggleRouteResponseSequential();
      await utils.waitForAutosave();
    });

    for (const testCase of testCases) {
      it(testCase.description, async () => {
        await http.assertCall(testCase);
      });
    }
  });
});

describe('Rules tabs', () => {
  it('should shows the rule count in rules tab', async () => {
    await utils.assertElementText(routes.rulesTab, 'Rules');

    await routes.switchTab('RULES');
    await routes.addResponseRule({
      modifier: 'var',
      target: 'params',
      value: '10',
      operator: 'equals'
    });

    // this is needed for the tab re-render to complete
    await browser.pause(100);
    await utils.assertElementText(routes.rulesTab, 'Rules 1');

    await routes.addResponseRule({
      modifier: 'test',
      target: 'query',
      value: 'true',
      operator: 'equals'
    });

    // this is needed for the tab re-render to complete
    await browser.pause(100);
    await utils.assertElementText(routes.rulesTab, 'Rules 2');

    await routes.addRouteResponse();
    await routes.assertCountRouteResponses(4);

    // this is needed for the tab re-render to complete
    await browser.pause(100);
    await utils.assertElementText(routes.rulesTab, 'Rules');

    await routes.switchTab('RULES');
    await routes.addResponseRule({
      modifier: 'var',
      target: 'params',
      value: '10',
      operator: 'equals'
    });

    // this is needed for the tab re-render to complete
    await browser.pause(100);
    await utils.assertElementText(routes.rulesTab, 'Rules 1');
  });
});

describe('Response rules random or sequential', () => {
  it('should verify sequential responses is enabled', async () => {
    await utils.assertHasClass(routes.randomResponseIcon, 'text-primary', true);
    await utils.assertHasClass(routes.sequentialResponseIcon, 'text-primary');

    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/response-rules.json',
      ['routes.3.randomResponse', 'routes.3.sequentialResponse'],
      [false, true]
    );
  });

  it('should enable random responses and sequential responses should be disabled', async () => {
    await routes.toggleRouteResponseRandom();
    await utils.assertHasClass(routes.randomResponseIcon, 'text-primary');
    await utils.assertHasClass(
      routes.sequentialResponseIcon,
      'text-primary',
      true
    );

    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/response-rules.json',
      ['routes.3.randomResponse', 'routes.3.sequentialResponse'],
      [true, false]
    );
  });

  it('should disable random responses and both options should be disabled', async () => {
    await routes.toggleRouteResponseRandom();
    await utils.assertHasClass(routes.randomResponseIcon, 'text-primary', true);
    await utils.assertHasClass(
      routes.sequentialResponseIcon,
      'text-primary',
      true
    );

    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/response-rules.json',
      ['routes.3.randomResponse', 'routes.3.sequentialResponse'],
      [false, false]
    );
  });
});
