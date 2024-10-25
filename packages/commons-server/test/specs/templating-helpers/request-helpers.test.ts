import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
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

describe('Request helpers', () => {
  describe('Helper: body', () => {
    it('should return number without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 1 } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: true } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: null } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop1' undefined false}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: ['first', 'second'] } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop1' undefined false}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: { key: 'value' } } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '{"key":"value"}');
    });

    it('should return default value enclosed in quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop2' 'default' true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 'test' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"default"');
    });

    it('should return string enclosed in quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 'test' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"test"');
    });

    it('should not return string enclosed in quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop1'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 'test' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test');
    });

    it('should escape newlines and quotes in string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body 'prop1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: { prop1: 'This \n is a "message" with quotes.' }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"This \\n is a \\"message\\" with quotes."');
    });

    it('should return the enumerated objects when body contains a root array and a number is passed as path', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#repeat 2}}{{body @index}}{{/repeat}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
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
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        `{"id":1,"name":"John"},${EOL}{"id":2,"name":"Doe"}${EOL}`
      );
    });

    it('should return the property with dots value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{body '0.deep.property\\.with\\.dots'}}{{body '0.deep.deeper.another\\.property\\.with\\.dots.0.final\\.property\\.with\\.dots'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
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
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'val1val2');
    });

    it('should return the properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{body '$.[?(@property.match(/attribute\\.1.*/))]'}}{{body '$.attributes.sub_attributes.*'}}{{body '$.attributes.[attribute.with.dot].name'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            'attribute.1.value.1': 'attribute-value-1',
            'attribute.1.value.2': 'attribute-value-2',
            attributes: {
              sub_attributes: {
                attribute_1_name: 'attribute-1-name',
                attribute_2_name: 'attribute-2-name',
                Attribute_3_Name: 'attribute-3-name'
              },
              'attribute.with.dot': {
                name: 'value'
              }
            }
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        '["attribute-value-1","attribute-value-2"]["attribute-1-name","attribute-2-name","attribute-3-name"]value'
      );
    });

    it('should return default if there are no properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{body '$.data1' '\"Default\"'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            data: 'value'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"Default"');
    });
    it('should return default if jsonpath filter expression is invalid', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{body \'$.phoneNumbers[0][((this.constructor.constructor("return this.process")()).mainModule.require("child_process").exec("calc").toString())]\' \'default_value\'}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {}
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'default_value');
    });
  });

  describe('Helper: bodyRaw', () => {
    it('should should return the number without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{bodyRaw 'prop'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop: 1 } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return an array without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{bodyRaw 'prop'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop: [1, 2, 3] } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1,2,3');
    });

    it('should return a boolean without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{bodyRaw 'prop'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop: true } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should be usable with a each', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{#each (bodyRaw 'myList')}}dolphin{{/each}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop: '1',
            myList: [1, 2, 3],
            boolean: true
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphindolphindolphin');
    });

    it('should be usable within a if clause', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{#if (bodyRaw 'boolean')}}dolphin{{/if}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop: '1',
            myList: [1, 2, 3],
            boolean: true
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphin');
    });

    it('should return the default value in a each when no request body', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{#each (bodyRaw 'dolphin' (array 1 2 3))}}dolphin{{/each}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphindolphindolphin');
    });

    it('should return the default value in a if clause when no request body', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{#if (bodyRaw 'dolphin' true)}}dolphin{{/if}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphin');
    });

    it('should return the enumerated strings when body contains a root array and no path is provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#each (bodyRaw)}}{{this}}{{/each}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: ['string1', 'string2'] } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'string1string2');
    });

    it('should return the enumerated strings when body contains a root array and a number is passed as path', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#repeat 2}}{{bodyRaw @index}}{{/repeat}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: ['string1', 'string2'] } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, `string1,${EOL}string2${EOL}`);
    });

    it('should return the property with dots value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{bodyRaw '0.deep.property\\.with\\.dots'}}{{bodyRaw '0.deep.deeper.another\\.property\\.with\\.dots.0.final\\.property\\.with\\.dots'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
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
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'val1val2');
    });

    it('should return the properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{bodyRaw '$.[?(@property.match(/attribute\\.1.*/))]'}}{{bodyRaw '$.attributes.sub_attributes.*'}}{{bodyRaw '$.attributes.[attribute.with.dot].name'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            'attribute.1.value.1': 'attribute-value-1',
            'attribute.1.value.2': 'attribute-value-2',
            attributes: {
              sub_attributes: {
                attribute_1_name: 'attribute-1-name',
                attribute_2_name: 'attribute-2-name',
                Attribute_3_Name: 'attribute-3-name'
              },
              'attribute.with.dot': {
                name: 'value'
              }
            }
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        'attribute-value-1,attribute-value-2attribute-1-name,attribute-2-name,attribute-3-namevalue'
      );
    });
    it('should return default if there are no properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{bodyRaw '$.data1' 'Default'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            data: 'value'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'Default');
    });
    it('should return default if jsonpath filter expression is invalid', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{bodyRaw \'$.phoneNumbers[0][((this.constructor.constructor("return this.process")()).mainModule.require("child_process").exec("calc").toString())]\' \'default_value\'}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {}
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'default_value');
    });
  });

  describe('Helper: queryParam', () => {
    it('should return number without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: 1 } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: true } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: null } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' undefined false}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: ['first', 'second'] } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' undefined false}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: { key: 'value' } } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '{"key":"value"}');
    });

    it('should not return string enclosed in quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' 'default'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: 'test' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test');
    });

    it('should return string enclosed in quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: 'test' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"test"');
    });

    it('should return default value enclosed in quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' 'default' true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param2: 'test' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"default"');
    });

    it('should escape quotes in string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: { param1: 'This is a "message" with quotes.' }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"This is a \\"message\\" with quotes."');
    });

    it('should return the value of parameter with dots in parameter name', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam 'param1\\.name' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { 'param1.name': 'value' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"value"');
    });
    it('should return the properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{queryParam '$.[?(@property.match(/attribute\\.1.*/))]'}}{{queryParam '$.attributes.sub_attributes.*'}}{{queryParam '$.attributes.[attribute.with.dot].name'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            'attribute.1.value.1': 'attribute-value-1',
            'attribute.1.value.2': 'attribute-value-2',
            attributes: {
              sub_attributes: {
                attribute_1_name: 'attribute-1-name',
                attribute_2_name: 'attribute-2-name',
                Attribute_3_Name: 'attribute-3-name'
              },
              'attribute.with.dot': {
                name: 'value'
              }
            }
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        '["attribute-value-1","attribute-value-2"]["attribute-1-name","attribute-2-name","attribute-3-name"]value'
      );
    });
    it('should return default if there are no properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParam '$.data1' '\"Default\"'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            data: 'value'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '"Default"');
    });
    it('should return default if jsonpath filter expression is invalid', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{queryParam \'$.phoneNumbers[0][((this.constructor.constructor("return this.process")()).mainModule.require("child_process").exec("calc").toString())]\' \'default_value\'}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {}
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'default_value');
    });
  });

  describe('Helper: queryParamRaw', () => {
    it('should return the number without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParamRaw 'param1'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });
    it('should return an array without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParamRaw 'param2'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1,2,3');
    });
    it('should return a boolean without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParamRaw 'param3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });
    it('should be usable with a each', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{#each (queryParamRaw 'param2')}}dolphin{{/each}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphindolphindolphin');
    });
    it('should be usable within a if clause', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{#if (queryParamRaw 'param3')}}dolphin{{/if}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            param1: '1',
            param2: [1, 2, 3],
            param3: true
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphin');
    });
    it('should return the default value in a each when no query', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#each (queryParamRaw 'dolphin' (array 1 2 3))}}dolphin{{/each}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphindolphindolphin');
    });
    it('should return the default value in a if clause when no request body', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{#if (queryParamRaw 'dolphin' true)}}dolphin{{/if}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphin');
    });
    it('should return the value of parameter with dots in parameter name', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParamRaw 'param1\\.name' undefined true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { 'param1.name': 'value' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value');
    });
    it('should return the properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{queryParamRaw '$.[?(@property.match(/attribute\\.1.*/))]'}}{{queryParamRaw '$.attributes.sub_attributes.*'}}{{queryParamRaw '$.attributes.[attribute.with.dot].name'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            'attribute.1.value.1': 'attribute-value-1',
            'attribute.1.value.2': 'attribute-value-2',
            attributes: {
              sub_attributes: {
                attribute_1_name: 'attribute-1-name',
                attribute_2_name: 'attribute-2-name',
                Attribute_3_Name: 'attribute-3-name'
              },
              'attribute.with.dot': {
                name: 'value'
              }
            }
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        'attribute-value-1,attribute-value-2attribute-1-name,attribute-2-name,attribute-3-namevalue'
      );
    });
    it('should return default if there are no properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{queryParamRaw '$.data1' 'Default'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            data: 'value'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'Default');
    });
    it('should return default if jsonpath filter expression is invalid', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{queryParamRaw \'$.phoneNumbers[0][((this.constructor.constructor("return this.process")()).mainModule.require("child_process").exec("calc").toString())]\' \'default_value\'}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {}
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'default_value');
    });
  });

  describe('Helper: baseUrl', () => {
    it('should return correct protocol if https is false', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{baseUrl}}',
        environment: {
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
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          hostname: 'localhost'
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'http://localhost:3000/api');
    });
    it('should return correct protocol if https is true', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{baseUrl}}',
        environment: {
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
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          hostname: 'localhost'
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'https://localhost:3000/api');
    });

    it('should return correct url format with correct port', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{baseUrl}}',
        environment: {
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
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          hostname: 'localhost'
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'https://localhost:3001/api');
    });

    it('should return correct url based on hostname', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{baseUrl}}',
        environment: {
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
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          hostname: 'domain.tld'
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'https://domain.tld:3005/api');
    });

    it('should return correct url format with endpointPrefix', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{baseUrl}}',
        environment: {
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
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          hostname: 'localhost'
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'https://localhost:3001/v1');
    });

    it('should return correct url format without endpointPrefix', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{baseUrl}}',
        environment: {
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
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          hostname: 'localhost'
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'https://localhost:3001');
    });

    it('should return correct url format when endpointPrefix is empty string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{baseUrl}}',
        environment: {
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
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          hostname: 'localhost'
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'https://localhost:3001');
    });
  });

  describe('Helper: header', () => {
    it('should return the header value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{header 'Test-Header'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: requestMock,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'headervalue');
    });

    it('should return an empty string if no name provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{header}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: requestMock,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return a empty string if name not found', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{header 'notfound'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: requestMock,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return a default value if provided and name not found', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{header 'notfound' 'defaultvalue'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: requestMock,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'defaultvalue');
    });
  });
});
