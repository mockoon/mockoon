import { format as dateFormat } from 'date-fns';
import { promises as fs } from 'fs';
import { EOL } from 'os';
import environments from '../libs/environments';
import http from '../libs/http';
import modals from '../libs/modals';
import { HttpCall } from '../libs/models';
import routes from '../libs/routes';
import settings from '../libs/settings';
import utils from '../libs/utils';

const testSuites: { name: string; tests: HttpCall[] }[] = [
  {
    name: 'Body helper: text/plain Content-Type (incompatible with path search)',
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
          body: '{"teststring":"stringcontent","testboolean":true,"testnumber":5,"testnull":null}'
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
          body: '{ "response": {"teststring":"stringcontent","testboolean":true,"testnumber":5,"testnull":null} }'
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
        body: 'param1%5B%5D=content1&param1%5B%5D=content2&param1%5B%5D=content3',
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
        body: 'param1%5B%5D=content1&param1%5B%5D=content2&param1%5B%5D=content3',
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
        path: '/queryparam-rootlvl-arrayitem?paramarray[]=test1&paramarray[]=test2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'test2'
        }
      },
      {
        description: 'Helper: queryParam property in object, root level',
        path: '/queryparam-rootlvl-objectproperty?paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
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
        path: '/queryparam-rootlvl-object?paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '{"prop1":"testprop1","prop2":"testprop2"}'
        }
      },
      {
        description: 'Helper: queryParam multiple fetch, deep level',
        path: '/queryparam-multiple?param1=param1value&paramarray[]=test1&paramarray[]=test2&paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '{ "param1": "param1value","arrayitem": "test2","objprop": "testprop2","fullarray": ["test1","test2"],"fullobj": {"prop1":"testprop1","prop2":"testprop2"} }'
        }
      },
      {
        description: 'Helper: queryParam full object with empty path param',
        path: '/queryparam-full-emptypath?param1=param1value&paramarray[]=test1&paramarray[]=test2&paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '{"param1":"param1value","paramarray":["test1","test2"],"paramobj":{"prop1":"testprop1","prop2":"testprop2"}}'
        }
      },
      {
        description: 'Helper: queryParam full object with no path param',
        path: '/queryparam-full-nopath?param1=param1value&paramarray[]=test1&paramarray[]=test2&paramobj[prop1]=testprop1&paramobj[prop2]=testprop2',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '{"param1":"param1value","paramarray":["test1","test2"],"paramobj":{"prop1":"testprop1","prop2":"testprop2"}}'
        }
      },
      {
        description: 'Helper: formdata',
        path: '/formdata',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=X-BOUNDARY'
        },
        body: '--X-BOUNDARY\r\nContent-Disposition: form-data; name="file"; filename="filename.csv"\r\nContent-Type: text/csv\r\n\r\nfilecontent\r\n--X-BOUNDARY\r\nContent-Disposition: form-data; name="var1"\r\n\r\nval1\r\n--X-BOUNDARY\r\nContent-Disposition: form-data; name="select"\r\n\r\nsv1\r\n--X-BOUNDARY\r\nContent-Disposition: form-data; name="select"\r\n\r\nsv2\r\n--X-BOUNDARY\r\nContent-Disposition: form-data; name="object[property]"\r\n\r\nobjv1\r\n--X-BOUNDARY--\r\n',
        testedResponse: {
          status: 200,
          body: 'filename.csvtext/csv11-val1-sv1,sv2-objv1'
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
          body: dateFormat(new Date(), 'yyyy-MM-dd', {
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
        path: '/objectid',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i
        }
      },
      {
        description: 'Helper: base64 (inline + block helper)',
        path: '/base64',
        method: 'GET',
        body: 'test',
        testedResponse: {
          status: 200,
          body: 'dGVzdA==dGVzdHRlc3R0ZXN0dGVzdHRlc3R0ZXN0dGVzdHRlc3R0ZXN0dGVzdA=='
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
              '-- Header parsing error, see logs for more details --'
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
    name: 'Old Dummy JSON helpers',
    tests: [
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
  },
  {
    name: 'Data helpers',
    tests: [
      {
        description:
          'Helper: databucket should be called by its name, part of its name or full ID',
        path: '/nameDatabucket',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'checkcheckcheck'
        }
      },
      {
        description: 'Helper: databucket call should return an empty string',
        path: '/emptyDatabucket',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: ''
        }
      },
      {
        description: 'Helper: databucket call should return a string',
        path: '/stringDatabucket',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'string'
        }
      },
      {
        description: 'Helper: databucket call should return a number',
        path: '/numberDatabucket',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: '1'
        }
      },
      {
        description: 'Helper: databucket call should return a boolean',
        path: '/booleanDatabucket',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'true'
        }
      },
      {
        description:
          'Helper: databucket call with request helper should return a properly parsed content',
        path: '/rqHelpersDatabucket?param1=value',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'value'
        }
      },
      {
        description:
          'Helper: databucket call with request helper should return the same content despite given new param',
        path: '/rqHelpersDatabucket?param1=newValue',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'value'
        }
      },
      {
        description:
          'Helper: databucket call with faker helper should return a value when given a path',
        path: '/pathDatabucket',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'Hayley.Abbott14'
        }
      },
      {
        description:
          'Helper: databucket call with faker helper should return the same value when called a second time',
        path: '/pathDatabucket',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'Hayley.Abbott14'
        }
      }
    ]
  }
];

const fakerSeedingTest: HttpCall = {
  path: '/fakerseed',
  method: 'GET',
  headers: { 'Content-Type': 'text/plain' },
  testedResponse: {
    status: 200,
    body: 'AR45 1FU'
  }
};

const globalVarTests: Record<string, HttpCall> = {
  beforeSet: {
    description: '',
    path: '/getglobalvar',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: ''
    }
  },
  setVar: {
    description: '',
    path: '/setglobalvar',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: ''
    }
  },
  afterSet: {
    description: '',
    path: '/getglobalvar',
    method: 'GET',
    testedResponse: {
      status: 200,
      body: 'value1'
    }
  }
};

describe('Templating', () => {
  describe('Helpers', () => {
    before(async () => {
      await fs.copyFile(
        './test/data/res/file-templating-error.txt',
        './tmp/storage/file-templating-error.txt'
      );
      await fs.copyFile(
        './test/data/res/file-templating.txt',
        './tmp/storage/file-templating.txt'
      );
      await fs.copyFile('./test/data/res/file.txt', './tmp/storage/file.txt');
    });

    it('should open and start the environment', async () => {
      await environments.open('templating');
      await settings.open();
      await settings.setSettingValue('settings-faker-seed', '1');
      await modals.close();
      await utils.waitForAutosave();
      await environments.start();
    });

    testSuites.forEach((testSuite) => {
      describe(testSuite.name, () => {
        testSuite.tests.forEach((testCase) => {
          it(testCase.description, async () => {
            await http.assertCall(testCase);
          });
        });
      });
    });
  });

  describe('Disable route response templating', () => {
    it('should get body content with disabled templating', async () => {
      await routes.select(1);
      await routes.switchTab('SETTINGS');
      await routes.toggleDisableTemplating();

      await utils.waitForAutosave();
      await http.assertCall({
        path: '/bodyjson-rootlvl',
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        testedResponse: {
          status: 200,
          body: "{{body 'property1' 'defaultvalue'}}"
        }
      });
    });

    it('should get file content with disabled templating', async () => {
      await routes.select(20);
      await routes.switchTab('SETTINGS');
      await routes.toggleDisableTemplating();
      await utils.waitForAutosave();
      await http.assertCall({
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

  describe('Server restart should reset the Faker seeding', () => {
    it('should open and start the environment', async () => {
      await environments.close(1);
      await environments.open('templating');
      await settings.open();
      await settings.setSettingValue('settings-faker-seed', '1');
      await settings.setDropdownSettingValue('settings-faker-locale', 17);
      await modals.close();
      await utils.waitForAutosave();
      await environments.start();
    });

    it('should receive seeded and localized content', async () => {
      await http.assertCall(fakerSeedingTest);
    });

    it('should receive same seeded and localized content after a restart', async () => {
      await environments.stop();
      await environments.start();
      await http.assertCall(fakerSeedingTest);
    });
  });

  describe('Global vars are reset when the serve restart', () => {
    it('should open and start the environment', async () => {
      await environments.close(1);
      await environments.open('templating');
      await environments.start();
    });

    it('should receive empty content when no var is set', async () => {
      await http.assertCall(globalVarTests.beforeSet);
    });

    it('should set the var and receive its content', async () => {
      await http.assertCall(globalVarTests.setVar);
      await http.assertCall(globalVarTests.afterSet);
    });

    it('should receive empty content after restarting the server', async () => {
      await environments.stop();
      await environments.start();
      await http.assertCall(globalVarTests.beforeSet);
    });
  });
});
