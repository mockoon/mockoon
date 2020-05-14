import { format as dateFormat } from 'date-fns';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const testSuites: { name: string; tests: HttpCall[] }[] = [
  {
    name: 'Body helper: no Content-Type',
    tests: [
      {
        description: 'Body, no content type',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: {},
        body: { property1: 'stringcontent' },
        testedResponse: {
          status: 200,
          body: 'defaultvalue'
        }
      },
      {
        description: 'Body, no content type, no default value',
        path: '/bodyjson-rootlvl-nodefault',
        method: 'POST',
        headers: {},
        body: { property1: 'stringcontent' },
        testedResponse: {
          status: 200,
          body: ''
        }
      }
    ]
  },
  {
    name: 'Body helper: Request body application/json',
    tests: [
      {
        description: 'Empty body',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        testedResponse: {
          status: 200,
          body: 'defaultvalue'
        }
      },
      {
        description: 'Empty body, no default value',
        path: '/bodyjson-rootlvl-nodefault',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        testedResponse: {
          status: 200,
          body: ''
        }
      },
      {
        description: 'Root level string',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { property1: 'stringcontent' },
        testedResponse: {
          status: 200,
          body: 'stringcontent'
        }
      },
      {
        description: 'Root level number',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { property1: 10 },
        testedResponse: {
          status: 200,
          body: '10'
        }
      },
      {
        description: 'Root level boolean',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { property1: false },
        testedResponse: {
          status: 200,
          body: 'false'
        }
      },
      {
        description: 'Root level null',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { property1: null },
        testedResponse: {
          status: 200,
          body: 'null'
        }
      },
      {
        description: 'Root level object',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          property1: {
            teststring: 'stringcontent',
            testboolean: true,
            testnumber: 5,
            testnull: null
          }
        },
        testedResponse: {
          status: 200,
          body:
            '{"teststring":"stringcontent","testboolean":true,"testnumber":5,"testnull":null}'
        }
      },
      {
        description: 'Root level default value (path not found)',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { anotherproperty: 'test' },
        testedResponse: {
          status: 200,
          body: 'defaultvalue'
        }
      },
      {
        description: 'Non-root level string',
        path: '/bodyjson',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { property1: 'stringcontent' },
        testedResponse: {
          status: 200,
          body: '{ "response": stringcontent }'
        }
      },
      {
        description: 'Non-root level number',
        path: '/bodyjson',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { property1: 10 },
        testedResponse: {
          status: 200,
          body: '{ "response": 10 }'
        }
      },
      {
        description: 'Non-root level boolean',
        path: '/bodyjson',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { property1: false },
        testedResponse: {
          status: 200,
          body: '{ "response": false }'
        }
      },
      {
        description: 'Non-root level null',
        path: '/bodyjson',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { property1: null },
        testedResponse: {
          status: 200,
          body: '{ "response": null }'
        }
      },
      {
        description: 'Non-root level object',
        path: '/bodyjson',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          property1: {
            teststring: 'stringcontent',
            testboolean: true,
            testnumber: 5,
            testnull: null
          }
        },
        testedResponse: {
          status: 200,
          body:
            '{ "response": {"teststring":"stringcontent","testboolean":true,"testnumber":5,"testnull":null} }'
        }
      },
      {
        description: 'Non-root level default value (path not found)',
        path: '/bodyjson',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { anotherproperty: 'test' },
        testedResponse: {
          status: 200,
          body: '{ "response": defaultvalue }'
        }
      },
      {
        description: 'Non-root level complex path',
        path: '/bodyjson-path',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { root: { array: [{}, {}, { property1: 'test1' }] } },
        testedResponse: {
          status: 200,
          body: '{ "response": "test1" }'
        }
      }
    ]
  },
  {
    /**
     * Reference form:
     * <form method="post">
     *   <input type="email" name="email" value="john@example.com" />
     *   <input type="text" name="name" value="john" />
     *   <input type="checkbox" name="areyousure" checked>
     *   <input type="radio" name="choice" value="choice1">
     *   <input type="radio" name="choice" value="choice2" checked>
     *   <input type="radio" name="choice" value="choice3">
     *   <input type="text" name="comments" value="comment1">
     *   <input type="text" name="comments" value="comment2">
     *   <input type="text" name="comments" value="comment3">
     *   <input type="text" name="moreinfo[part1]" value="moreinfo1">
     *   <input type="text" name="moreinfo[part2]" value="moreinfo2">
     *   <input type="submit" value="submit" />
     * </form>
     *
     * Produces:
     * email=john%40example.com&name=john&areyousure=on&choice=choice2&comments=comment1& comments=comment2&comments=comment3&moreinfo%5Bpart1%5D=moreinfo1& moreinfo%5Bpart2%5D=moreinfo2
     */
    name: 'Body helper: Request body application/x-www-form-urlencoded',
    tests: [
      {
        description: 'Empty body',
        path: '/bodyform-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        testedResponse: {
          status: 200,
          body: 'defaultvalue'
        }
      },
      {
        description: 'Empty body, no default value',
        path: '/bodyform-rootlvl-nodefault',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        testedResponse: {
          status: 200,
          body: ''
        }
      },
      {
        description: 'Root level string',
        path: '/bodyform-rootlvl',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'param1=stringcontent',
        testedResponse: {
          status: 200,
          body: 'stringcontent'
        }
      },
      {
        description: 'Root level array',
        path: '/bodyform-rootlvl',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'param1=content1&param1=content2&param1=content3',
        testedResponse: {
          status: 200,
          body: '["content1","content2","content3"]'
        }
      },
      {
        description: 'Root level array (with array notation)',
        path: '/bodyform-rootlvl',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body:
          'param1%5B%5D=content1&param1%5B%5D=content2&param1%5B%5D=content3',
        testedResponse: {
          status: 200,
          body: '["content1","content2","content3"]'
        }
      },
      {
        description: 'Root level object',
        path: '/bodyform-rootlvl',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'param1%5Bpart1%5D=content1&param1%5Bpart2%5D=content2',
        testedResponse: {
          status: 200,
          body: '{"part1":"content1","part2":"content2"}'
        }
      },
      {
        description: 'Non-root level string',
        path: '/bodyform',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'param1=stringcontent',
        testedResponse: {
          status: 200,
          body: '{ "response": stringcontent }'
        }
      },
      {
        description: 'Non-root level array',
        path: '/bodyform',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'param1=content1&param1=content2&param1=content3',
        testedResponse: {
          status: 200,
          body: '{ "response": ["content1","content2","content3"] }'
        }
      },
      {
        description: 'Non-root level array (with array notation)',
        path: '/bodyform',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body:
          'param1%5B%5D=content1&param1%5B%5D=content2&param1%5B%5D=content3',
        testedResponse: {
          status: 200,
          body: '{ "response": ["content1","content2","content3"] }'
        }
      },
      {
        description: 'Non-root level object',
        path: '/bodyform',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'param1%5Bpart1%5D=content1&param1%5Bpart2%5D=content2',
        testedResponse: {
          status: 200,
          body: '{ "response": {"part1":"content1","part2":"content2"} }'
        }
      },
      {
        description: 'Non-root level object path',
        path: '/bodyform-path',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'param1%5Bpart1%5D=content1&param1%5Bpart2%5D=content2',
        testedResponse: {
          status: 200,
          body: '{ "response": content1 }'
        }
      }
    ]
  },
  {
    name: 'Helper in file path',
    tests: [
      {
        description: 'Body helper',
        path: '/filepath',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: { test: 'file' },
        testedResponse: {
          status: 200,
          body: 'filebody'
        }
      }
    ]
  },
  {
    name: 'Helper in file content',
    tests: [
      {
        description: 'Body helper',
        path: '/file-templating',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: { test: 'bodycontent' },
        testedResponse: {
          status: 200,
          body: 'startbodycontentend'
        }
      }
    ]
  },
  {
    name: 'Other helpers',
    tests: [
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
      },
      {
        description: 'Bad helper name',
        path: '/bad-helper',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'startend'
        }
      }
    ]
  },
  {
    name: 'Templating syntax Errors',
    tests: [
      {
        description: 'Templating syntax error in body',
        path: '/templating-syntax-error-body',
        method: 'GET',
        testedResponse: {
          status: 200,
          body:
            "Error while serving the content: Parse error on line 1:\nstart{{body 'test'}}}end"
        }
      },
      {
        description: 'Templating syntax error in header',
        path: '/templating-syntax-error-header',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'body',
          headers: {
            'test-header':
              '-- Parsing error. Check logs for more information --'
          }
        }
      },
      {
        description: 'Templating syntax error in file path',
        path: '/templating-syntax-error-filepath',
        method: 'GET',
        testedResponse: {
          status: 200,
          body:
            "Error while serving the file: Parse error on line 1:\n...:/test/{{body 'test'}}}.txt"
        }
      },
      {
        description: 'Templating syntax error in file',
        path: '/templating-syntax-error-file',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: { test: 'bodycontent' },
        testedResponse: {
          status: 200,
          body:
            "Error while serving the file: Parse error on line 1:\n{{body 'test'}}}"
        }
      }
    ]
  }
];

describe('Templating', () => {
  const tests = new Tests('templating');
  tests.runHooks();

  it('Start default environment', async () => {
    await tests.helpers.startEnvironment();
  });

  testSuites.forEach((testSuite) => {
    describe(testSuite.name, () => {
      testSuite.tests.forEach((testCase) => {
        it(testCase.description, async () => {
          await tests.helpers.httpCallAsserter(testCase);
        });
      });
    });
  });
});
