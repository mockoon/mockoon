import { format as dateFormat } from 'date-fns';
import { EOL } from 'os';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const testSuites: { name: string; tests: HttpCall[] }[] = [
  {
    name:
      'Body helper: text/plain Content-Type (incompatible with path search)',
    tests: [
      {
        description: 'Body path, default value',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '{"property1":"stringcontent"}',
        testedResponse: {
          status: 200,
          body: 'defaultvalue'
        }
      },
      {
        description: 'Body path, no default value',
        path: '/bodyjson-rootlvl-nodefault',
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '{"property1":"stringcontent"}',
        testedResponse: {
          status: 200,
          body: ''
        }
      },
      {
        description: 'Full body, no path param provided',
        path: '/bodyjson-full-noparam',
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '{"property1":"stringcontent"}',
        testedResponse: {
          status: 200,
          body: '{"property1":"stringcontent"}'
        }
      },
      {
        description: 'Full body, empty path param',
        path: '/bodyjson-full-emptyparam',
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '{"property1":"stringcontent"}',
        testedResponse: {
          status: 200,
          body: '{"property1":"stringcontent"}'
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
        description: 'Invalid body',
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test":"invalid}',
        testedResponse: {
          status: 200,
          body: 'defaultvalue'
        }
      },
      {
        description: 'Invalid body, no default value',
        path: '/bodyjson-rootlvl-nodefault',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test":"invalid}',
        testedResponse: {
          status: 200,
          body: ''
        }
      },
      {
        description: 'Full body, no path parameter provided',
        path: '/bodyjson-full-noparam',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": "testcontent"}',
        testedResponse: {
          status: 200,
          body: '{"test": "testcontent"}'
        }
      },
      {
        description: 'Full body, empty path parameter',
        path: '/bodyjson-full-emptyparam',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": "testcontent"}',
        testedResponse: {
          status: 200,
          body: '{"test": "testcontent"}'
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
        description: 'Full body, no path parameter provided',
        path: '/bodyform-full-noparam',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'param1=stringcontent',
        testedResponse: {
          status: 200,
          body: 'param1=stringcontent'
        }
      },
      {
        description: 'Full body, empty path parameter',
        path: '/bodyform-full-emptyparam',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'param1=stringcontent',
        testedResponse: {
          status: 200,
          body: 'param1=stringcontent'
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
        description: 'Relative unix-like path with body helper',
        path: '/filepath',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: { test: 'file' },
        testedResponse: {
          status: 200,
          body: 'filebody'
        }
      },
      {
        description: 'Relative windows-like path with body helper',
        path: '/filepath-windows',
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
        description: 'Helper: queryParam, empty, no default value',
        path: '/queryparam-rootlvl-nodefault',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: ''
        }
      },
      {
        description: 'Helper: queryParam, empty, with default value',
        path: '/queryparam-rootlvl',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'defaultqueryparam'
        }
      },
      {
        description: 'Helper: queryParam property, root level',
        path: '/queryparam-rootlvl?param1=testqueryparam1',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'testqueryparam1'
        }
      },
      {
        description:
          'Helper: queryParam missing property, root level (default value)',
        path: '/queryparam-rootlvl?param2=testqueryparam2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'defaultqueryparam'
        }
      },
      {
        description: 'Helper: queryParam item in array, root level',
        path:
          '/queryparam-rootlvl-arrayitem?paramarray[]=test1&paramarray[]=test2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'test2'
        }
      },
      {
        description: 'Helper: queryParam property in object, root level',
        path:
          '/queryparam-rootlvl-objectproperty?paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'testprop2'
        }
      },
      {
        description: 'Helper: queryParam sub array, root level',
        path: '/queryparam-rootlvl-array?paramarray[]=test1&paramarray[]=test2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '["test1","test2"]'
        }
      },
      {
        description: 'Helper: queryParam sub object, root level',
        path:
          '/queryparam-rootlvl-object?paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '{"prop1":"testprop1","prop2":"testprop2"}'
        }
      },
      {
        description: 'Helper: queryParam multiple fetch, deep level',
        path:
          '/queryparam-multiple?param1=param1value&paramarray[]=test1&paramarray[]=test2&paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body:
            '{ "param1": "param1value","arrayitem": "test2","objprop": "testprop2","fullarray": ["test1","test2"],"fullobj": {"prop1":"testprop1","prop2":"testprop2"} }'
        }
      },
      {
        description: 'Helper: queryParam full object with empty path param',
        path:
          '/queryparam-full-emptypath?param1=param1value&paramarray[]=test1&paramarray[]=test2&paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body:
            '{"param1":"param1value","paramarray":["test1","test2"],"paramobj":{"prop1":"testprop1","prop2":"testprop2"}}'
        }
      },
      {
        description: 'Helper: queryParam full object with no path param',
        path:
          '/queryparam-full-nopath?param1=param1value&paramarray[]=test1&paramarray[]=test2&paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body:
            '{"param1":"param1value","paramarray":["test1","test2"],"paramobj":{"prop1":"testprop1","prop2":"testprop2"}}'
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
          body: dateFormat(new Date(), 'yyyy-MM-DD', {
            useAdditionalWeekYearTokens: true,
            useAdditionalDayOfYearTokens: true
          })
        }
      },
      {
        description: 'Helper: newline',
        path: '/newline',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '\n'
        }
      },
      {
        description: 'Helper: random objectId',
        path: '/objectid_1',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i
        }
      },
      {
        description: 'Helper: objectId based on time',
        path: '/objectid_2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '54495ad94c934721ede76d90'
        }
      },
      {
        description: 'Helper: base64 (inline + block helper)',
        path: '/base64',
        method: 'GET',
        body: 'test',
        testedResponse: {
          status: 200,
          body:
            'dGVzdA==dGVzdHRlc3R0ZXN0dGVzdHRlc3R0ZXN0dGVzdHRlc3R0ZXN0dGVzdA=='
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
          body: {
            contains:
              "Error while serving the content: Parse error on line 1:\nstart{{body 'test'}}}end"
          }
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
          body: {
            contains:
              "Error while serving the content: Parse error on line 1:\n...:/test/{{body 'test'}}}.txt"
          }
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
          body: {
            contains:
              "Error while serving the file content: Parse error on line 1:\n{{body 'test'}}}"
          }
        }
      }
    ]
  },
  {
    // Goal is to test Faker.js helper and passed parameters
    name: 'Faker.js helpers',
    tests: [
      {
        description: 'Missing helper',
        path: '/faker.missing',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: {
            contains:
              'Error while serving the content: Faker method name is missing'
          }
        }
      },
      {
        description: 'Empty helper',
        path: '/faker.empty',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: {
            contains:
              'Error while serving the content: Faker method name is missing'
          }
        }
      },
      {
        description: 'Helper with invalid pattern',
        path: '/faker.wrong-pattern',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: { contains: 'abcd is not a valid Faker method' }
        }
      },
      {
        description: 'Non existing helper',
        path: '/faker.not-exists',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: { contains: 'abcd.efgh is not a valid Faker method' }
        }
      },
      {
        description: 'Helper: company.companyName',
        path: '/faker.company.companyName',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'Zieme - Reichel'
        }
      },
      {
        description: 'Helper: address.streetAddress',
        path: '/faker.address.streetAddress',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '013 Feil Wells/31336 Kali Keys Suite 436'
        }
      },
      {
        description: 'Helper: date.between',
        path: '/faker.date.between',
        method: 'GET',
        testedResponse: {
          status: 200,
          // build date with timezone so it works locally and in GitHub Actions
          body: new Date('1970-01-01T02:00:00.000+02:00').toString()
        }
      },
      {
        description: 'Helper: date.month',
        path: '/faker.date.month',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'March-Jun'
        }
      },
      {
        description: 'Helper: finance.amount',
        path: '/faker.finance.amount',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '500.87812'
        }
      },
      {
        description: 'Helper: finance.mask',
        path: '/faker.finance.mask',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '(...2056944541)'
        }
      },
      {
        description: 'Helper: helpers.createCard (object retrieval)',
        path: '/faker.helpers.userCard',
        method: 'GET',
        testedResponse: {
          status: 200,
          body:
            '{"name":"Cedric Schmidt","username":"Michel.Wisoky9","email":"Josh_Terry82@hotmail.com","address":{"street":"Alison Club","suite":"Apt. 108","city":"Aydenstad","zipcode":"69451","geo":{"lat":"34.5379","lng":"-75.7333"}},"phone":"1-367-840-0769","website":"magnolia.net","company":{"name":"Goyette and Sons","catchPhrase":"Seamless context-sensitive artificial intelligence","bs":"optimize bleeding-edge supply-chains"}}'
        }
      },
      {
        description: 'Helper: random.uuid',
        path: '/faker.random.uuid',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'e14e4128-01ae-43e4-8790-9992f94b3186'
        }
      }
    ]
  },
  {
    name: 'Old Dummy JSON helpers (Faker.js aliases)',
    tests: [
      {
        description: 'Helper: int',
        path: '/old.int',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '29'
        }
      },
      {
        description: 'Helper: float',
        path: '/old.float',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '0.694400158'
        }
      },
      {
        description: 'Helper: date',
        path: '/old.date',
        method: 'GET',
        testedResponse: {
          status: 200,
          // build date with timezone so it works locally and in GitHub Actions
          body: dateFormat(
            new Date('2020-06-08T05:47:58.000+02:00'),
            'yyyy-MM-dd HH:mm:ss',
            {
              useAdditionalWeekYearTokens: true,
              useAdditionalDayOfYearTokens: true
            }
          )
        }
      },
      {
        description: 'Helper: time',
        path: '/old.time',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '12:49:42'
        }
      },
      {
        description: 'Helper: boolean',
        path: '/old.boolean',
        method: 'GET',
        testedResponse: { status: 200, body: 'true' }
      },
      {
        description: 'Helper: title',
        path: '/old.title',
        method: 'GET',
        testedResponse: { status: 200, body: 'Mr.' }
      },
      {
        description: 'Helper: firstName',
        path: '/old.firstName',
        method: 'GET',
        testedResponse: { status: 200, body: 'Nova' }
      },
      {
        description: 'Helper: lastName',
        path: '/old.lastName',
        method: 'GET',
        testedResponse: { status: 200, body: 'Leuschke' }
      },
      {
        description: 'Helper: company',
        path: '/old.company',
        method: 'GET',
        testedResponse: { status: 200, body: 'Ondricka Inc' }
      },
      {
        description: 'Helper: domain',
        path: '/old.domain',
        method: 'GET',
        testedResponse: { status: 200, body: 'jordi.net' }
      },
      {
        description: 'Helper: tld',
        path: '/old.tld',
        method: 'GET',
        testedResponse: { status: 200, body: 'org' }
      },
      {
        description: 'Helper: email',
        path: '/old.email',
        method: 'GET',
        testedResponse: { status: 200, body: 'Kyleigh_Tillman13@gmail.com' }
      },
      {
        description: 'Helper: street',
        path: '/old.street',
        method: 'GET',
        testedResponse: { status: 200, body: '1883 Cassandra Keys' }
      },
      {
        description: 'Helper: city',
        path: '/old.city',
        method: 'GET',
        testedResponse: { status: 200, body: 'Timmyborough' }
      },
      {
        description: 'Helper: country',
        path: '/old.country',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'Guadeloupe'
        }
      },
      {
        description: 'Helper: countryCode',
        path: '/old.countryCode',
        method: 'GET',
        testedResponse: { status: 200, body: 'MH' }
      },
      {
        description: 'Helper: zipcode',
        path: '/old.zipcode',
        method: 'GET',
        testedResponse: { status: 200, body: '67186-6673' }
      },
      {
        description: 'Helper: postcode',
        path: '/old.postcode',
        method: 'GET',
        testedResponse: { status: 200, body: '72387' }
      },
      {
        description: 'Helper: lat',
        path: '/old.lat',
        method: 'GET',
        testedResponse: { status: 200, body: '-12.9436' }
      },
      {
        description: 'Helper: long',
        path: '/old.long',
        method: 'GET',
        testedResponse: { status: 200, body: '137.2831' }
      },
      {
        description: 'Helper: phone',
        path: '/old.phone',
        method: 'GET',
        testedResponse: { status: 200, body: '264.601.7904 x35943' }
      },
      {
        description: 'Helper: color',
        path: '/old.color',
        method: 'GET',
        testedResponse: { status: 200, body: 'white' }
      },
      {
        description: 'Helper: hexColor',
        path: '/old.hexColor',
        method: 'GET',
        testedResponse: { status: 200, body: 'c34eb9' }
      },
      {
        description: 'Helper: guid',
        path: '/old.guid',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'ec940c92-5980-4eb5-bec9-704edb8f1272'
        }
      },
      {
        description: 'Helper: ipv4',
        path: '/old.ipv4',
        method: 'GET',
        testedResponse: { status: 200, body: '190.238.49.178' }
      },
      {
        description: 'Helper: ipv6',
        path: '/old.ipv6',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '713c:8c3e:0b81:2060:1083:1d48:38fd:4134'
        }
      },
      {
        description: 'Helper: lorem',
        path: '/old.lorem',
        method: 'GET',
        testedResponse: {
          status: 200,
          body:
            'Sunt qui similique ut quam natus consequatur sit vel et nostrum ut.'
        }
      },
      {
        description: 'Helper: repeat',
        path: '/old.repeat',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: `test,${EOL}test,${EOL}test,${EOL}test,${EOL}test${EOL}`
        }
      },
      {
        description: 'Helper: repeat with inner helper',
        path: '/old.repeat.inner',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: `Mike,${EOL}Rae,${EOL}Lesley,${EOL}Gideon,${EOL}Herta${EOL}`
        }
      },
      {
        description: 'Helper: repeat with invalid syntax',
        path: '/old.repeat.invalid',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: { contains: 'The repeat helper requires a numeric param' }
        }
      },
      {
        description: 'Helper: switch from urlParam, string case value',
        path: '/old.switch.urlParam/1',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'casecontent1'
        }
      },
      {
        description: 'Helper: switch from urlParam, number case value',
        path: '/old.switch.urlParam/2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'casecontent2'
        }
      },
      {
        description: 'Helper: switch from urlParam, default',
        path: '/old.switch.urlParam/11',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'defaultcontent'
        }
      },
      {
        description: 'Helper: switch from urlParam with inner helper',
        path: '/old.switch.urlParam.helper/1',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'GET'
        }
      },
      {
        description: 'Helper: switch from urlParam with inner helper, default',
        path: '/old.switch.urlParam.helper/11',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'defaultcontentGET'
        }
      },
      {
        description: 'Helper: multiple switches from urlParam',
        path: '/old.switch.urlParam.multi/1/2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'switch1casecontent1switch2casecontent2'
        }
      },
      {
        description: 'Helper: switch from queryParam, string case value',
        path: '/old.switch.queryParam?qp=1',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'casecontent1'
        }
      },
      {
        description: 'Helper: switch from queryParam, number case value',
        path: '/old.switch.queryParam?qp=2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'casecontent2'
        }
      },
      {
        description: 'Helper: switch from queryParam, default',
        path: '/old.switch.queryParam?qp=11',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'defaultcontent'
        }
      },
      {
        description: 'Helper: switch from body, string case value',
        path: '/old.switch.body',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "prop": 1 }',
        testedResponse: {
          status: 200,
          body: 'casecontent1'
        }
      },
      {
        description: 'Helper: switch from body, number case value',
        path: '/old.switch.body',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: { prop: 2 },
        testedResponse: {
          status: 200,
          body: 'casecontent2'
        }
      },
      {
        description: 'Helper: switch from body, boolean case value',
        path: '/old.switch.body',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: { prop: true },
        testedResponse: {
          status: 200,
          body: 'casecontenttrue'
        }
      },
      {
        description: 'Helper: switch from body, default',
        path: '/old.switch.body',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: { prop: 'nothing' },
        testedResponse: {
          status: 200,
          body: 'defaultcontent'
        }
      }
    ]
  }
];

describe('Templating', () => {
  describe('Helpers', () => {
    const tests = new Tests('templating');

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

  describe('Disable route response templating', () => {
    const tests = new Tests('templating');

    it('Start default environment', async () => {
      await tests.helpers.startEnvironment();
    });

    it('Get body content with disabled templating', async () => {
      await tests.helpers.selectRoute(1);
      await tests.helpers.switchTab('SETTINGS');
      await tests.helpers.toggleDisableTemplating();

      await tests.helpers.httpCallAsserter({
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        testedResponse: {
          status: 200,
          body: "{{body 'property1' 'defaultvalue'}}"
        }
      });
    });

    it('Get file content with disabled templating', async () => {
      await tests.helpers.selectRoute(20);
      await tests.helpers.switchTab('SETTINGS');
      await tests.helpers.toggleDisableTemplating();
      await tests.helpers.httpCallAsserter({
        path: '/file-templating',
        method: 'GET',
        headers: { 'Content-Type': 'text/plain' },
        testedResponse: {
          status: 200,
          body: "start{{body 'test'}}end"
        }
      });
    });
  });
});
