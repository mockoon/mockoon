import { ResponseRuleTargets, RouteResponse } from '@mockoon/commons';
import { expect } from 'chai';
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
  default: false
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
  default: false
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
      false,
      false
    ).chooseResponse(1);

    expect(routeResponse.body).to.be.equal('unauthorized');
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
              operator: 'equals'
            }
          ],
          body: 'invalid'
        }
      ],
      request,
      false,
      false
    ).chooseResponse(1);

    expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'regex'
              }
            ],
            body: 'query1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query1');
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
                operator: 'equals'
              }
            ],
            body: 'query2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'query3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query3');
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
                operator: 'regex'
              }
            ],
            body: 'query4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query4');
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
                operator: 'regex'
              }
            ],
            body: 'query5'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query5');
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
                operator: 'equals'
              }
            ],
            body: 'query6'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'query7'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'null'
              }
            ],
            body: 'query7'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query7');
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
                operator: 'empty_array'
              }
            ],
            body: 'query7'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query7');
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
                operator: 'regex'
              }
            ],
            body: 'params1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('params1');
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
                operator: 'equals'
              }
            ],
            body: 'params2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('params2');
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
                operator: 'equals'
              }
            ],
            body: 'params3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'params4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'params5'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'request_number_1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('request_number_1');
    });

    it("should not return response if request number don't matches", () => {
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
                operator: 'equals'
              }
            ],
            body: 'request_number_1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(2);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'regex'
              }
            ],
            body: 'request_number_regex'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(99);
      expect(routeResponse.body).to.be.equal('request_number_regex');
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
                operator: 'regex'
              }
            ],
            body: 'request_number_regex'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(101);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'regex'
              },
              {
                target: 'request_number',
                modifier: '',
                value: '1|2',
                operator: 'regex'
              }
            ],
            rulesOperator: 'AND',
            body: 'request_number_complex1'
          }
        ],
        request,
        false,
        false
      );

      expect(responseRulesinterpreter.chooseResponse(1).body).to.be.equal(
        'request_number_complex1'
      );
      expect(responseRulesinterpreter.chooseResponse(2).body).to.be.equal(
        'request_number_complex1'
      );
      expect(responseRulesinterpreter.chooseResponse(3).body).to.be.equal(
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
        false,
        true
      );
      expect(responseRulesInterpreter.chooseResponse(1).body).to.be.equal(
        'request_number_1'
      );
      expect(responseRulesInterpreter.chooseResponse(1).body).to.be.equal(
        'request_number_1'
      );
      expect(responseRulesInterpreter.chooseResponse(3).body).to.be.equal(
        'request_number_3'
      );
      expect(responseRulesInterpreter.chooseResponse(4).body).to.be.equal(
        'request_number_4'
      );
      expect(responseRulesInterpreter.chooseResponse(5).body).to.be.equal(
        'request_number_1'
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
                operator: 'regex'
              }
            ],
            body: 'header1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('header1');
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
                operator: 'equals'
              }
            ],
            body: 'header2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('header2');
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
                operator: 'equals'
              }
            ],
            body: 'header3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'header4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'header5'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'regex'
              }
            ],
            body: 'cookie1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('cookie1');
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
                operator: 'equals'
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('cookie2');
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
                operator: 'equals'
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('cookie2');
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
                operator: 'equals'
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'null'
              }
            ],
            body: 'cookie2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('cookie2');
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
                operator: 'equals'
              }
            ],
            body: 'cookie3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'cookie3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'regex'
              }
            ],
            body: 'body1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body1');
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
                operator: 'equals'
              }
            ],
            body: 'body2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body2');
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
                operator: 'equals'
              }
            ],
            body: 'body3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            body: 'body4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body4');
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
                operator: 'equals'
              }
            ],
            body: 'body5'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body5');
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
                operator: 'regex'
              }
            ],
            body: 'body6'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body6');
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
                operator: 'equals'
              }
            ],
            body: 'body7'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body7');
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
                operator: 'regex'
              }
            ],
            body: 'body8'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body8');
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
                operator: 'equals'
              }
            ],
            body: 'body9'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body9');
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
                operator: 'equals'
              }
            ],
            body: 'body10'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body10');
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
                operator: 'equals'
              }
            ],
            body: 'body11'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body11');
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
                operator: 'equals'
              }
            ],
            body: 'body12'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body12');
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
                operator: 'regex'
              }
            ],
            body: 'body13'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body13');
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
                operator: 'equals'
              }
            ],
            body: 'body14'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body14');
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
                operator: 'equals'
              }
            ],
            body: 'body15'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body15');
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
                operator: 'equals'
              }
            ],
            body: 'body16'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body16');
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
                operator: 'regex'
              }
            ],
            body: 'body17'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body17');
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
                operator: 'equals'
              }
            ],
            body: 'body19'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body19');
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
                operator: 'equals'
              } as any
            ],
            body: 'body19'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body19');
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
                operator: 'equals'
              } as any
            ],
            body: 'body20'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body20');
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
                operator: 'equals'
              } as any
            ],
            body: 'body21'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body21');
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
                operator: 'equals'
              } as any
            ],
            body: 'body21'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body21');
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
                operator: 'equals'
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                operator: 'equals'
              }
            ],
            rulesOperator: 'AND',
            body: 'complex1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('complex1');
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
                operator: 'equals'
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue1',
                operator: 'equals'
              }
            ],
            rulesOperator: 'AND',
            body: 'complex2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                operator: 'equals'
              }
            ],
            rulesOperator: 'OR',
            body: 'complex3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('complex3');
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
                operator: 'equals'
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                operator: 'equals'
              }
            ],
            rulesOperator: 'OR',
            body: 'complex4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
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
                operator: 'equals'
              }
            ],
            rulesOperator: 'OR',
            body: 'response2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('response2');
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
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('content');
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
                operator: 'regex'
              }
            ],
            rulesOperator: 'OR',
            default: false
          },
          { ...routeResponseTemplate, body: 'content2', default: true }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('content1');
    });
  });
});
