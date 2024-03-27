import {
  BodyTypes,
  EnvironmentDefault,
  GenerateUniqueID,
  ResponseMode,
  ResponseRuleTargets,
  RouteResponse
} from '@mockoon/commons';
import { strictEqual } from 'assert';
import { Request } from 'express';
import QueryString from 'qs';
import { xml2js } from 'xml-js';
import { ResponseRulesInterpreter } from '../../../src/libs/response-rules-interpreter';

const routeResponse403: RouteResponse = {
  uuid: '',
  body: 'unauthorized',
  latency: 0,
  statusCode: 403,
  label: '',
  headers: [
    {
      key: 'Content-Type',
      value: 'text/plain'
    }
  ],
  filePath: '',
  sendFileAsBody: false,
  disableTemplating: false,
  fallbackTo404: false,
  rules: [],
  rulesOperator: 'OR',
  default: false,
  bodyType: BodyTypes.INLINE,
  databucketID: '',
  crudKey: '',
  callbacks: []
};

const routeResponseTemplate: RouteResponse = {
  uuid: '',
  body: '',
  latency: 0,
  statusCode: 200,
  label: '',
  headers: [
    {
      key: 'Content-Type',
      value: 'text/plain'
    }
  ],
  filePath: '',
  sendFileAsBody: false,
  disableTemplating: false,
  fallbackTo404: false,
  rules: [],
  rulesOperator: 'OR',
  default: false,
  bodyType: BodyTypes.INLINE,
  databucketID: '',
  crudKey: '',
  callbacks: []
};

describe('Response rules interpreter', () => {
  it('should return default response (no rule fulfilled)', () => {
    const request: Request = {
      header: function (headerName: string) {
        const headers = { 'Content-Type': 'application/json' };

        return headers[headerName];
      },
      body: ''
    } as Request;

    const routeResponse = new ResponseRulesInterpreter(
      [routeResponse403, routeResponseTemplate],
      request,
      null,
      EnvironmentDefault,
      [],
      {},
      ''
    ).chooseResponse(1);

    strictEqual(routeResponse?.body, 'unauthorized');
  });

  it('should return default response if rule is invalid (missing target)', () => {
    const request: Request = {
      header: function (headerName: string) {
        const headers = { 'Content-Type': 'application/json' };

        return headers[headerName];
      },
      body: '{"prop": "value"}',
      query: { prop: 'value' } as QueryString.ParsedQs,
      params: { prop: 'value' } as QueryString.ParsedQs
    } as Request;

    const routeResponse = new ResponseRulesInterpreter(
      [
        routeResponse403,
        {
          ...routeResponseTemplate,
          rules: [
            {
              target: '' as ResponseRuleTargets,
              modifier: 'prop',
              value: 'value',
              operator: 'equals',
              invert: false
            }
          ],
          body: 'invalid'
        }
      ],
      request,
      null,
      EnvironmentDefault,
      [],
      {},
      ''
    ).chooseResponse(1);

    strictEqual(routeResponse?.body, 'unauthorized');
  });

  describe('Query string rules', () => {
    it('should return response if query param matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'valuetest' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: '^value',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'query1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query1');
    });

    it('should return response if query param do no matches (inverted)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'notvalue' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: 'value',
                operator: 'equals',
                invert: true
              }
            ],
            body: 'query1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query1');
    });

    it('should return default response if query param does not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'value' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: 'val',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'query2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if query param matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'value' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: 'value',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'query3'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query3');
    });

    it('should return response if query param value contained in array (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { array: ['test2'] } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'array',
                value: 'test1|test2',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'query4'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query4');
    });

    it('should return response if query param value contained in array (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { array: ['test2'] } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'array',
                value: 'test2',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'query5'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query5');
    });

    it('should return default response if query param modifier not present', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { prop: 'value' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: '',
                value: 'value',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'query6'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return default response if query param is empty', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { prop: undefined } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'prop',
                value: 'value',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'query7'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if operator is "null" and no value query param was given', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { prop: undefined } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'shouldNotBeSet',
                value: '',
                operator: 'null',
                invert: false
              }
            ],
            body: 'query7'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query7');
    });

    it('should return response if operator is "empty_array" and empty array was given', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { prop: undefined, examples: [] } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'examples',
                value: '',
                operator: 'empty_array',
                invert: false
              }
            ],
            body: 'query7'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query7');
    });

    it('should return default response if query param does not match (regex, bad case)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'value' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: 'Value',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'query8'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if query param matches (regex_i)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'value' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: 'Value',
                operator: 'regex_i',
                invert: false
              }
            ],
            body: 'query9'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query9');
    });

    it('should return default response if query param does not match data bucket param', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'wrongValue' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: '{{data "RuleBucket" "prop"}}',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'query10'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [
          {
            id: GenerateUniqueID(),
            name: 'RuleBucket',
            value: { prop: 'value' },
            parsed: true
          }
        ],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if query param matches data bucket param', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'value' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: '{{data "RuleBucket" "prop"}}',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'query11'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [
          {
            id: GenerateUniqueID(),
            name: 'RuleBucket',
            value: { prop: 'value' },
            parsed: false
          }
        ],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'query11');
    });

    it('should return response if query param extracted using jsonpath matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { 'prop.with.dot': 'value' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: '$.obj.[prop.with.dot]',
                value: 'value',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'value'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'value');
    });
  });

  describe('Route params rules', () => {
    it('should return response if route param value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '111' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: 'id',
                value: '^1',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'params1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'params1');
    });

    it('should return response if route param value does not match (inverted)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '2' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: 'id',
                value: '1',
                operator: 'equals',
                invert: true
              }
            ],
            body: 'params1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'params1');
    });

    it('should return response if route param value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '111' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: 'id',
                value: '111',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'params2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'params2');
    });

    it('should return default response if route param modifier not present', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '111' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: '',
                value: '111',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'params3'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return default response if route param value does not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '111' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: '',
                value: '11',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'params4'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return default response if route param value is empty', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: undefined } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: '',
                value: '11',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'params5'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if route param matches body param', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        stringBody: '{"name": "john"}',
        body: { name: 'john' },
        params: { name: 'john' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: 'name',
                value: '{{body "name"}}',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'params6'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'params6');
    });
  });

  describe('Global var rules', () => {
    const request: Request = {
      header: function (headerName: string) {
        return '';
      },
      body: '',
      params: {} as QueryString.ParsedQs
    } as Request;

    it('should return default response when global var is not present', () => {
      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'global_var',
                modifier: 'testvar',
                value: 'testvalue',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'globalvar1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {
          // empty
        },
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return the correct response when global var is present (string), using object path', () => {
      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'global_var',
                modifier: 'testvar',
                value: 'testvalue',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'globalvar2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {
          testvar: 'testvalue'
        },
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'globalvar2');
    });

    it('should return the correct response when global var is present number (number), using object path', () => {
      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'global_var',
                modifier: 'testvar',
                value: '2',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'globalvar3'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {
          testvar: 2
        },
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'globalvar3');
    });

    it('should return the correct response when global var is present number (deep bool prop), using object path', () => {
      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'global_var',
                modifier: 'testvar.prop1',
                value: 'false',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'globalvar4'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {
          testvar: { prop1: false }
        },
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'globalvar4');
    });

    it('should return the correct response when global var is present number (deep string prop), using JSONPath', () => {
      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'global_var',
                modifier: '$.testvar.prop1',
                value: 'testvalue',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'globalvar5'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {
          testvar: { prop1: 'testvalue' }
        },
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'globalvar5');
    });
  });

  describe('Data bucket rules', () => {
    const request: Request = {
      header: function (headerName: string) {
        return '';
      },
      body: '',
      params: {} as QueryString.ParsedQs
    } as Request;

    it('should return default response when data bucket prop is not present', () => {
      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            statusCode: 204,
            rules: [
              {
                target: 'data_bucket',
                modifier: 'test.path',
                value: 'testValue',
                operator: 'equals',
                invert: false
              }
            ]
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [
          // empty
        ],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.statusCode, 403);
    });

    it('should return the correct response when data bucket prop is present, using bucket name and object path', () => {
      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            statusCode: 204,
            rules: [
              {
                target: 'data_bucket',
                modifier: 'Best Bucket.onRequest.returnStatusCode',
                value: '204',
                operator: 'equals',
                invert: false
              }
            ]
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [
          {
            id: GenerateUniqueID(),
            name: 'Best Bucket',
            value: { onRequest: { returnStatusCode: 204 } },
            parsed: true
          }
        ],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.statusCode, 204);
    });

    it('should return the correct response when data bucket prop is present, using bucket id and JSONPath', () => {
      const bucketId = GenerateUniqueID();
      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            statusCode: 204,
            rules: [
              {
                target: 'data_bucket',
                modifier: `$.${bucketId}[0].key`,
                value: 'value',
                operator: 'equals',
                invert: false
              }
            ]
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [
          {
            id: bucketId,
            name: 'bucket',
            value: [{ key: 'value' }],
            parsed: true
          }
        ],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.statusCode, 204);
    });
  });

  describe('Request number rules', () => {
    it('should return response if request number matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '1',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'request_number_1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'request_number_1');
    });

    it('should return response if request number does not match (inverted)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '1',
                operator: 'equals',
                invert: true
              }
            ],
            body: 'request_number_not_1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(2);
      strictEqual(routeResponse?.body, 'request_number_not_1');
    });

    it("should return default response if request number don't matches", () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '1',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'request_number_1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(2);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if request number matches regex', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '^[1-9][0-9]?$|^100$',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'request_number_regex'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(99);
      strictEqual(routeResponse?.body, 'request_number_regex');
    });

    it("should not return response if request don't matches regex", () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '^[1-9][0-9]?$|^100$',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'request_number_regex'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(101);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if both rules match with request number', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            Authorization: 'test'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const responseRulesinterpreter = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Authorization',
                value: '^$|s+',
                operator: 'regex',
                invert: false
              },
              {
                target: 'request_number',
                modifier: '',
                value: '1|2',
                operator: 'regex',
                invert: false
              }
            ],
            rulesOperator: 'AND',
            body: 'request_number_complex1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      );

      strictEqual(
        responseRulesinterpreter.chooseResponse(1)?.body,
        'request_number_complex1'
      );
      strictEqual(
        responseRulesinterpreter.chooseResponse(2)?.body,
        'request_number_complex1'
      );
      strictEqual(
        responseRulesinterpreter.chooseResponse(3)?.body,
        'unauthorized'
      );
    });
  });

  describe('Sequential responses', () => {
    it('should return each response depending on the request call index and go back to the first one', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const responseRulesInterpreter = new ResponseRulesInterpreter(
        [
          {
            ...routeResponseTemplate,
            body: 'request_number_1'
          },
          {
            ...routeResponseTemplate,
            body: 'request_number_2'
          },
          {
            ...routeResponseTemplate,
            body: 'request_number_3'
          },
          {
            ...routeResponseTemplate,
            body: 'request_number_4'
          }
        ],
        request,
        ResponseMode.SEQUENTIAL,
        EnvironmentDefault,
        [],
        {},
        ''
      );
      strictEqual(
        responseRulesInterpreter.chooseResponse(1)?.body,
        'request_number_1'
      );
      strictEqual(
        responseRulesInterpreter.chooseResponse(1)?.body,
        'request_number_1'
      );
      strictEqual(
        responseRulesInterpreter.chooseResponse(3)?.body,
        'request_number_3'
      );
      strictEqual(
        responseRulesInterpreter.chooseResponse(4)?.body,
        'request_number_4'
      );
      strictEqual(
        responseRulesInterpreter.chooseResponse(5)?.body,
        'request_number_1'
      );
    });
  });

  describe('Disabled rules response mode', () => {
    it('should return the default response when the rules are disabled', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const responseRulesInterpreter = new ResponseRulesInterpreter(
        [
          {
            ...routeResponseTemplate,
            body: 'request_number_1'
          },
          {
            ...routeResponseTemplate,
            body: 'request_number_2',
            default: true
          }
        ],
        request,
        ResponseMode.DISABLE_RULES,
        EnvironmentDefault,
        [],
        {},
        ''
      );
      strictEqual(
        responseRulesInterpreter.chooseResponse(1)?.body,
        'request_number_2'
      );
    });
  });

  describe('Headers rules', () => {
    it('should return response if header value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: '^UTF',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'header1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'header1');
    });

    it('should return response if header value does not match (inverted)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'ISOsomething'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: 'UTF-8',
                operator: 'equals',
                invert: true
              }
            ],
            body: 'header1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'header1');
    });

    it('should return response if header value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: 'UTF-8',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'header2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'header2');
    });

    it('should return default response if header value does not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: 'UTF-16',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'header3'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return default response if header value is empty', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': undefined
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: 'UTF-16',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'header4'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return default response if header modifier not present', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: '',
                value: 'UTF-8',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'header5'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });
  });

  describe('Cookie rules', () => {
    it('should return response if cookie value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        cookies: {
          login: 'tommy',
          othercookie: 'testme'
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: 'login',
                value: 'tom.+',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'cookie1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'cookie1');
    });

    it('should return response if cookie value does not match (inverted)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        cookies: {
          login: 'notvalue'
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: 'login',
                value: 'value',
                operator: 'equals',
                invert: true
              }
            ],
            body: 'cookie1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'cookie1');
    });

    it('should return response if cookie value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        cookies: {
          login: 'tommy',
          othercookie: 'testme'
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: 'login',
                value: 'tommy',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'cookie2');
    });

    it('should return default response if cookie value does not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        cookies: {
          login: 'cola',
          othercookie: 'testme'
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: 'login',
                value: 'fanta',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if cookie value (empty) matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        cookies: {
          login: ''
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: 'login',
                value: '',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'cookie2');
    });

    it('should return default response if cookie is not set but compared with "equals"', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        cookies: {},
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: 'login',
                value: '',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return default response if cookie is not set (null)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        cookies: {},
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: 'login',
                value: '',
                operator: 'null',
                invert: false
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'cookie2');
    });

    it('should return default response if cookie modifier is not present', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        cookies: {
          login: 'cola',
          othercookie: 'testme'
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: '',
                value: 'cola',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'cookie3'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return default response if cookie modifier and value are not present', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        cookies: {
          login: 'cola',
          othercookie: 'testme'
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'cookie',
                modifier: '',
                value: '',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'cookie3'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });
  });

  describe('Body rules', () => {
    const xmlBody =
      '<?xml version="1.0" encoding="utf-8"?><user userId="1"><name>John</name></user>';

    it('should return response if full body value matches (no modifier + regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: 'bodyvalue',
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'value',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'body1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body1');
    });

    it('should return response if full body value does not match (no modifier + inverted)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: 'notbodyvalue',
        body: 'notbodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'bodyvalue',
                operator: 'equals',
                invert: true
              }
            ],
            body: 'body1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body1');
    });

    it('should return response if full body value matches (no modifier + no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: 'bodyvalue',
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'bodyvalue',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body2');
    });

    it('should return default response if full body value does not match (no modifier)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: 'bodyvalue',
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'body',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body3'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if JSON body property value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{"name": "john"}',
        body: { name: 'john' }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'name',
                value: 'john',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body4'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body4');
    });

    it('should return response if JSON body path value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{ "user": [{ "name": "John" }] }',
        body: { user: [{ name: 'John' }] }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'user.0.name',
                value: 'John',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body5'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body5');
    });

    it('should return response if JSON body path value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{ "user": [{ "name": "John" }] }',
        body: { user: [{ name: 'John' }] }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'user.0.name',
                value: '^John',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'body6'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body6');
    });

    it('should return response if JSON body path array values contains (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{ "users": ["John", "Johnny", "Paul"] }',
        body: { users: ['John', 'Johnny', 'Paul'] }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'users',
                value: 'John',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body7'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body7');
    });

    it('should return response if JSON body path array values contains (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{ "users": ["John", "Johnny", "Paul"] }',
        body: { users: ['John', 'Johnny', 'Paul'] }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'users',
                value: '^John',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'body8'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body8');
    });

    it('should return response if JSON body path value matches (no regex + charset in content-type)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json; Charset=UTF-8'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": "test" }',
        body: { test: 'test' }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'test',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body9'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body9');
    });

    it('should return response if JSON body path number value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": 1 }',
        body: { test: 1 }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: '1',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body10'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body10');
    });

    it('should return response if JSON body path boolean value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": false }',
        body: { test: false }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'false',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body11'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body11');
    });

    it('should return response if x-www-form body path value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        stringBody: 'param1=value1',
        body: { param1: 'value1' }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'param1',
                value: 'value1',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body12'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body12');
    });

    it('should return response if x-www-form body path value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        stringBody: 'param1=value1',
        body: { param1: 'value1' }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'param1',
                value: '^value',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'body13'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body13');
    });

    it('should return response if x-www-form body path array value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        stringBody: 'params[]=value1&params[]=value2',
        body: { params: ['value1', 'value2'] }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'params',
                value: 'value2',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body14'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body14');
    });

    it('should return response if x-www-form body path value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        stringBody: 'params[prop1]=value1&params[prop2]=value2',
        body: { params: { prop1: 'value1', prop2: 'value2' } }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'params.prop2',
                value: 'value2',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body15'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body15');
    });

    it('should return response if x-www-form full body value matches (no modifier + no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        stringBody: 'bodyvalue',
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'bodyvalue',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body16'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body16');
    });

    it('should return response if x-www-form full body value matches (no modifier + regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        stringBody: 'bodyvalue',
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'value',
                operator: 'regex',
                invert: false
              }
            ],
            body: 'body17'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body17');
    });

    it('should return response if JSON body property value is null', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{"prop1": null}',
        body: { prop1: null }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'prop1',
                value: '',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body19'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body19');
    });

    it('should return response if JSON body property value is null nad rule value is null too', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: '{"prop1": null}',
        body: { prop1: null }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'prop1',
                value: null,
                operator: 'equals',
                invert: false
              } as any
            ],
            body: 'body19'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body19');
    });

    it('should return response if XML body property value matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/xml',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        stringBody: xmlBody,
        body: xml2js(xmlBody, { compact: true })
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'user.name._text',
                value: 'John',
                operator: 'equals',
                invert: false
              } as any
            ],
            body: 'body20'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body20');
    });

    it('should return response if XML body attribute value matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/xml',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        stringBody: xmlBody,
        body: xml2js(xmlBody, { compact: true })
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'user._attributes.userId',
                value: '1',
                operator: 'equals',
                invert: false
              } as any
            ],
            body: 'body21'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body21');
    });

    it('should return response if XML initial tag attribute value matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/xml',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        stringBody: xmlBody,
        body: xml2js(xmlBody, { compact: true })
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '_declaration._attributes.version',
                value: '1.0',
                operator: 'equals',
                invert: false
              } as any
            ],
            body: 'body21'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body21');
    });

    it('should return response if JSON body path to property with dots value matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody:
          '[{"deep":{"property.with.dots":"val1","deeper":{"another.property.with.dots":[{"final.property.with.dots":"val2"}]}}}]',
        body: [
          {
            deep: {
              'property.with.dots': 'val1',
              deeper: {
                'another.property.with.dots': [
                  {
                    'final.property.with.dots': 'val2'
                  }
                ]
              }
            }
          }
        ]
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier:
                  '0.deep.deeper.another\\.property\\.with\\.dots.0.final\\.property\\.with\\.dots',
                value: 'val2',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'body6'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'body6');
    });
    it('should return response if JSON body path extracted using jsonpath matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        stringBody: '{"obj": {"prop.with.dot": "value"}}',
        body: { obj: { 'prop.with.dot': 'value' } }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '$.obj.[prop.with.dot]',
                value: 'value',
                operator: 'equals',
                invert: false
              }
            ],
            body: 'value'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'value');
    });
  });

  describe('Complex rules (AND/OR)', () => {
    it('should return response if both rules match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": "bodyvalue" }',
        body: { test: 'bodyvalue' }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                operator: 'equals',
                invert: false
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                operator: 'equals',
                invert: false
              }
            ],
            rulesOperator: 'AND',
            body: 'complex1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'complex1');
    });

    it('should return response if both rules match (with invert)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": "notbodyvalue" }',
        body: { test: 'notbodyvalue' }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                operator: 'equals',
                invert: true
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                operator: 'equals',
                invert: false
              }
            ],
            rulesOperator: 'AND',
            body: 'complex1'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'complex1');
    });

    it('should return default response if both rules do not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": "bodyvalue" }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                operator: 'equals',
                invert: false
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue1',
                operator: 'equals',
                invert: false
              }
            ],
            rulesOperator: 'AND',
            body: 'complex2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return response if one rule matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'empty'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": "bodyvalue" }',
        body: { test: 'bodyvalue' }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                operator: 'equals',
                invert: false
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                operator: 'equals',
                invert: false
              }
            ],
            rulesOperator: 'OR',
            body: 'complex3'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'complex3');
    });

    it('should return default response if none rule matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'empty'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": "empty" }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                operator: 'equals',
                invert: false
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                operator: 'equals',
                invert: false
              }
            ],
            rulesOperator: 'OR',
            body: 'complex4'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'unauthorized');
    });

    it('should return second response if first one has no rule with AND', () => {
      /**
       * This test is here to prevent a bug that occured when first response had no rule but a AND operator.
       * It intercepted everything and prevented to get the correct response.
       * See https://github.com/mockoon/commons-server/issues/6
       */
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        stringBody: '{ "test": "bodyvalue" }',
        body: { test: 'bodyvalue' }
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          {
            ...routeResponseTemplate,
            rules: [],
            rulesOperator: 'AND',
            body: 'response1'
          },
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                operator: 'equals',
                invert: false
              }
            ],
            rulesOperator: 'OR',
            body: 'response2'
          }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);
      strictEqual(routeResponse?.body, 'response2');
    });

    it('should return response marked as default if no rule fulfilled', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          { ...routeResponseTemplate, body: 'content', default: true }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'content');
    });

    it('should return response if rules fulfilled and ignore the response marked as default', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: 'bodyvalue',
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          {
            ...routeResponseTemplate,
            body: 'content1',
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'bodyvalue',
                operator: 'regex',
                invert: false
              }
            ],
            rulesOperator: 'OR',
            default: false
          },
          { ...routeResponseTemplate, body: 'content2', default: true }
        ],
        request,
        null,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'content1');
    });
  });

  describe('proxy rules', () => {
    it('should return response if rules fulfilled and ignore the response marked as default', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: 'bodyvalue',
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          {
            ...routeResponseTemplate,
            body: 'content1',
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'bodyvalue',
                operator: 'regex',
                invert: false
              }
            ],
            rulesOperator: 'OR',
            default: false
          },
          { ...routeResponseTemplate, body: 'content2', default: true }
        ],
        request,
        ResponseMode.FALLBACK,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse?.body, 'content1');
    });

    it('should not return response if rules not fulfilled', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        stringBody: 'not matching',
        body: 'not matching'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          {
            ...routeResponseTemplate,
            body: 'content1',
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'bodyvalue',
                operator: 'regex',
                invert: false
              }
            ],
            rulesOperator: 'OR',
            default: false
          },
          { ...routeResponseTemplate, body: 'content2', default: true }
        ],
        request,
        ResponseMode.FALLBACK,
        EnvironmentDefault,
        [],
        {},
        ''
      ).chooseResponse(1);

      strictEqual(routeResponse, null);
    });
  });
});
