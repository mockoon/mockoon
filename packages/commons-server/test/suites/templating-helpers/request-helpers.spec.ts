import { expect } from 'chai';
import { EOL } from 'os';
import { TemplateParser } from '../../../src/libs/template-parser';

const requestMock = {
  get: function (headerName: string) {
    const headers = {
      'Test-Header': 'headervalue'
    };

    return headers[headerName];
  }
} as any;

beforeEach(function () {
  delete requestMock.locals;
});

describe('Template parser', () => {
  describe('Helper: body', () => {
    it('should return number without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop1' undefined true}}",
        {} as any,
        [],
        { body: { prop1: 1 } } as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop1' undefined true}}",
        {} as any,
        [],
        { body: { prop1: true } } as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop1' undefined true}}",
        {} as any,
        [],
        { body: { prop1: null } } as any
      );
      expect(parseResult).to.be.equal('null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop1' undefined false}}",
        {} as any,
        [],
        { body: { prop1: ['first', 'second'] } } as any
      );
      expect(parseResult).to.be.equal('["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop1' undefined false}}",
        {} as any,
        [],
        { body: { prop1: { key: 'value' } } } as any
      );
      expect(parseResult).to.be.equal('{"key":"value"}');
    });

    it('should return default value enclosed in quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop2' 'default' true}}",
        {} as any,
        [],
        { body: { prop1: 'test' } } as any
      );
      expect(parseResult).to.be.equal('"default"');
    });

    it('should return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop1' undefined true}}",
        {} as any,
        [],
        { body: { prop1: 'test' } } as any
      );
      expect(parseResult).to.be.equal('"test"');
    });

    it('should not return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop1'}}",
        {} as any,
        [],
        { body: { prop1: 'test' } } as any
      );
      expect(parseResult).to.be.equal('test');
    });

    it('should escape newlines and quotes in string', () => {
      const parseResult = TemplateParser(
        false,
        "{{body 'prop1' undefined true}}",
        {} as any,
        [],
        { body: { prop1: 'This \n is a "message" with quotes.' } } as any
      );
      expect(parseResult).to.be.equal(
        '"This \\n is a \\"message\\" with quotes."'
      );
    });

    it('should return the enumerated objects when body contains a root array and a number is passed as path', () => {
      const parseResult = TemplateParser(
        false,
        '{{#repeat 2}}{{body @index}}{{/repeat}}',
        {} as any,
        [],
        {
          body: [
            {
              id: 1,
              name: 'John'
            },
            {
              id: 2,
              name: 'Doe'
            }
          ]
        } as any
      );
      expect(parseResult).to.be.equal(
        `{"id":1,"name":"John"},${EOL}{"id":2,"name":"Doe"}${EOL}`
      );
    });

    it('should return the property with dots value', () => {
      const parseResult = TemplateParser(
        false,
        "{{body '0.deep.property\\.with\\.dots'}}{{body '0.deep.deeper.another\\.property\\.with\\.dots.0.final\\.property\\.with\\.dots'}}",
        {} as any,
        [],
        {
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
        } as any
      );
      expect(parseResult).to.be.equal('val1val2');
    });
  });

  describe('Helper: bodyRaw', () => {
    it('should should return the number without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{bodyRaw 'prop'}}",
        {} as any,
        [],
        { body: { prop: 1 } } as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an array without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{bodyRaw 'prop'}}",
        {} as any,
        [],
        { body: { prop: [1, 2, 3] } } as any
      );
      expect(parseResult).to.be.equal('1,2,3');
    });

    it('should return a boolean without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{bodyRaw 'prop'}}",
        {} as any,
        [],
        { body: { prop: true } } as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should be usable with a each', () => {
      const parseResult = TemplateParser(
        false,
        "{{#each (bodyRaw 'myList')}}dolphin{{/each}}",
        {} as any,
        [],
        {
          body: {
            prop: '1',
            myList: [1, 2, 3],
            boolean: true
          }
        } as any
      );
      expect(parseResult).to.be.equal('dolphindolphindolphin');
    });

    it('should be usable within a if clause', () => {
      const parseResult = TemplateParser(
        false,
        "{{#if (bodyRaw 'boolean')}}dolphin{{/if}}",
        {} as any,
        [],
        {
          body: {
            prop: '1',
            myList: [1, 2, 3],
            boolean: true
          }
        } as any
      );
      expect(parseResult).to.be.equal('dolphin');
    });

    it('should return the default value in a each when no request body', () => {
      const parseResult = TemplateParser(
        false,
        "{{#each (bodyRaw 'dolphin' (array 1 2 3))}}dolphin{{/each}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('dolphindolphindolphin');
    });

    it('should return the default value in a if clause when no request body', () => {
      const parseResult = TemplateParser(
        false,
        "{{#if (bodyRaw 'dolphin' true)}}dolphin{{/if}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('dolphin');
    });

    it('should return the enumerated strings when body contains a root array and no path is provided', () => {
      const parseResult = TemplateParser(
        false,
        '{{#each (bodyRaw)}}{{this}}{{/each}}',
        {} as any,
        [],
        { body: ['string1', 'string2'] } as any
      );
      expect(parseResult).to.be.equal('string1string2');
    });

    it('should return the enumerated strings when body contains a root array and a number is passed as path', () => {
      const parseResult = TemplateParser(
        false,
        '{{#repeat 2}}{{bodyRaw @index}}{{/repeat}}',
        {} as any,
        [],
        { body: ['string1', 'string2'] } as any
      );
      expect(parseResult).to.be.equal(`string1,${EOL}string2${EOL}`);
    });

    it('should return the property with dots value', () => {
      const parseResult = TemplateParser(
        false,
        "{{bodyRaw '0.deep.property\\.with\\.dots'}}{{bodyRaw '0.deep.deeper.another\\.property\\.with\\.dots.0.final\\.property\\.with\\.dots'}}",
        {} as any,
        [],
        {
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
        } as any
      );
      expect(parseResult).to.be.equal('val1val2');
    });
  });

  describe('Helper: queryParam', () => {
    it('should return number without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' undefined true}}",
        {} as any,
        [],
        { query: { param1: 1 } } as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' undefined true}}",
        {} as any,
        [],
        { query: { param1: true } } as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' undefined true}}",
        {} as any,
        [],
        { query: { param1: null } } as any
      );
      expect(parseResult).to.be.equal('null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' undefined false}}",
        {} as any,
        [],
        { query: { param1: ['first', 'second'] } } as any
      );
      expect(parseResult).to.be.equal('["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' undefined false}}",
        {} as any,
        [],
        { query: { param1: { key: 'value' } } } as any
      );
      expect(parseResult).to.be.equal('{"key":"value"}');
    });

    it('should not return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' 'default'}}",
        {} as any,
        [],
        { query: { param1: 'test' } } as any
      );
      expect(parseResult).to.be.equal('test');
    });

    it('should return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' undefined true}}",
        {} as any,
        [],
        { query: { param1: 'test' } } as any
      );
      expect(parseResult).to.be.equal('"test"');
    });

    it('should return default value enclosed in quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' 'default' true}}",
        {} as any,
        [],
        { query: { param2: 'test' } } as any
      );
      expect(parseResult).to.be.equal('"default"');
    });

    it('should escape quotes in string', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParam 'param1' undefined true}}",
        {} as any,
        [],
        { query: { param1: 'This is a "message" with quotes.' } } as any
      );
      expect(parseResult).to.be.equal('"This is a \\"message\\" with quotes."');
    });
  });

  describe('Helper: queryParamRaw', () => {
    it('should return the number without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParamRaw 'param1'}}",
        {} as any,
        [],
        {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any
      );
      expect(parseResult).to.be.equal('1');
    });
    it('should return an array without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParamRaw 'param2'}}",
        {} as any,
        [],
        {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any
      );
      expect(parseResult).to.be.equal('1,2,3');
    });
    it('should return a boolean without quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{queryParamRaw 'param3'}}",
        {} as any,
        [],
        {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any
      );
      expect(parseResult).to.be.equal('true');
    });
    it('should be usable with a each', () => {
      const parseResult = TemplateParser(
        false,
        "{{#each (queryParamRaw 'param2')}}dolphin{{/each}}",
        {} as any,
        [],
        {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any
      );
      expect(parseResult).to.be.equal('dolphindolphindolphin');
    });
    it('should be usable within a if clause', () => {
      const parseResult = TemplateParser(
        false,
        "{{#if (queryParamRaw 'param3')}}dolphin{{/if}}",
        {} as any,
        [],
        {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any
      );
      expect(parseResult).to.be.equal('dolphin');
    });
    it('should return the default value in a each when no query', () => {
      const parseResult = TemplateParser(
        false,
        "{{#each (queryParamRaw 'dolphin' (array 1 2 3))}}dolphin{{/each}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('dolphindolphindolphin');
    });
    it('should return the default value in a if clause when no request body', () => {
      const parseResult = TemplateParser(
        false,
        "{{#if (queryParam 'dolphin' true)}}dolphin{{/if}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('dolphin');
    });
  });

  describe('Helper: baseUrl', () => {
    it('should return correct protocol if https is false', () => {
      const parseResult = TemplateParser(
        false,
        '{{baseUrl}}',
        {
          tlsOptions: {
            enabled: false,
            type: 'CERT',
            pfxPath: '',
            certPath: '',
            keyPath: '',
            caPath: '',
            passphrase: ''
          },
          port: 3000,
          endpointPrefix: 'api'
        } as any,
        [],
        {
          hostname: 'localhost'
        } as any
      );
      expect(parseResult).to.be.equal('http://localhost:3000/api');
    });
    it('should return correct protocol if https is true', () => {
      const parseResult = TemplateParser(
        false,
        '{{baseUrl}}',
        {
          tlsOptions: {
            enabled: true,
            type: 'CERT',
            pfxPath: '',
            certPath: '',
            keyPath: '',
            caPath: '',
            passphrase: ''
          },
          port: 3000,
          endpointPrefix: 'api'
        } as any,
        [],
        {
          hostname: 'localhost'
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3000/api');
    });

    it('should return correct url format with correct port', () => {
      const parseResult = TemplateParser(
        false,
        '{{baseUrl}}',
        {
          tlsOptions: {
            enabled: true,
            type: 'CERT',
            pfxPath: '',
            certPath: '',
            keyPath: '',
            caPath: '',
            passphrase: ''
          },
          port: 3001,
          endpointPrefix: 'api'
        } as any,
        [],
        {
          hostname: 'localhost'
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3001/api');
    });

    it('should return correct url based on hostname', () => {
      const parseResult = TemplateParser(
        false,
        '{{baseUrl}}',
        {
          port: 3005,
          tlsOptions: {
            enabled: true,
            type: 'CERT',
            pfxPath: '',
            certPath: '',
            keyPath: '',
            caPath: '',
            passphrase: ''
          },
          endpointPrefix: 'api'
        } as any,
        [],
        {
          hostname: 'domain.tld'
        } as any
      );
      expect(parseResult).to.be.equal('https://domain.tld:3005/api');
    });

    it('should return correct url format with endpointPrefix', () => {
      const parseResult = TemplateParser(
        false,
        '{{baseUrl}}',
        {
          tlsOptions: {
            enabled: true,
            type: 'CERT',
            pfxPath: '',
            certPath: '',
            keyPath: '',
            caPath: '',
            passphrase: ''
          },
          port: 3001,
          endpointPrefix: 'v1'
        } as any,
        [],
        {
          hostname: 'localhost'
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3001/v1');
    });

    it('should return correct url format without endpointPrefix', () => {
      const parseResult = TemplateParser(
        false,
        '{{baseUrl}}',
        {
          tlsOptions: {
            enabled: true,
            type: 'CERT',
            pfxPath: '',
            certPath: '',
            keyPath: '',
            caPath: '',
            passphrase: ''
          },
          port: 3001
        } as any,
        [],
        {
          hostname: 'localhost'
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3001');
    });

    it('should return correct url format when endpointPrefix is empty string', () => {
      const parseResult = TemplateParser(
        false,
        '{{baseUrl}}',
        {
          tlsOptions: {
            enabled: true,
            type: 'CERT',
            pfxPath: '',
            certPath: '',
            keyPath: '',
            caPath: '',
            passphrase: ''
          },
          port: 3001,
          endpointPrefix: ''
        } as any,
        [],
        {
          hostname: 'localhost'
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3001');
    });
  });

  describe('Helper: header', () => {
    it('should return the header value', () => {
      const parseResult = TemplateParser(
        false,
        "{{header 'Test-Header'}}",
        {} as any,
        [],
        requestMock
      );
      expect(parseResult).to.be.equal('headervalue');
    });

    it('should return an empty string if no name provided', () => {
      const parseResult = TemplateParser(
        false,
        '{{header}}',
        {} as any,
        [],
        requestMock
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return a empty string if name not found', () => {
      const parseResult = TemplateParser(
        false,
        "{{header 'notfound'}}",
        {} as any,
        [],
        requestMock
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return a default value if provided and name not found', () => {
      const parseResult = TemplateParser(
        false,
        "{{header 'notfound' 'defaultvalue'}}",
        {} as any,
        [],
        requestMock
      );
      expect(parseResult).to.be.equal('defaultvalue');
    });
  });

  describe('Helper: status', () => {
    it('should return request status undefined', () => {
      const parseResult = TemplateParser(
        false,
        'Hello',
        {} as any,
        [],
        requestMock
      );
      expect(requestMock.locals).to.be.undefined;
    });

    it('should return request status 404', () => {
      const parseResult = TemplateParser(
        false,
        '{{status 404}}',
        {} as any,
        [],
        requestMock
      );
      expect(requestMock.locals.get('statusCode')).to.be.equal(404);
    });

    it('should return request status 404 if condition is false', () => {
      const parseResult = TemplateParser(
        false,
        '{{#if (eq 1 0)}}{{status 404}}{{else}}Hello{{/if}}',
        {} as any,
        [],
        requestMock
      );
      expect(requestMock.locals).to.be.undefined;
    });
  });
});
