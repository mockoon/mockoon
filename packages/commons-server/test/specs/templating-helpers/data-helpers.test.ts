import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { TemplateParser } from '../../../src/libs/template-parser';

describe('Data helpers', () => {
  describe('Helper: Data', () => {
    it('should return nothing when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{data}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return nothing if given a wrong databucket name', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{data "wrongDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'rightDatabucket',
            id: '45fd',
            value: 'value of the databucket',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return number without without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{data "numberDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'numberDatabucket',
            id: 'd45s',
            value: '1',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{data "booleanDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'booleanDatabucket',
            id: 'd5zs',
            value: 'true',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{data "nullDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'nullDatabucket',
            id: 'gn18',
            value: 'null',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{data "arrayDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'arrayDatabucket',
            id: 'szed',
            value: ['first', 'second'],
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{data 'objectDatabucket'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'objectDatabucket',
            id: 'sc51',
            value: { key: 'value' },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '{"key":"value"}');
    });

    it('should return string without enclosing it in quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{data 'stringDatabucket'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'stringDatabucket',
            id: 'jh14',
            value: 'test',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test');
    });

    it('should return property at a path', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{data 'pathDatabucket' 'object1.prop1'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'w63q',
            value: {
              object1: { prop1: 'value1', prop2: 'value2' },
              prop: 'value',
              object2: []
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value1');
    });

    it('should return empty string if property at a path does not exists', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{data 'pathDatabucket' 'object1.prop3'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'w63q',
            value: {
              object1: { prop1: 'value1', prop2: 'value2' },
              prop: 'value',
              object2: []
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return falsy property at a path', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{data 'pathDatabucket' 'object1.prop1'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'w63q',
            value: {
              object1: { prop1: false }
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return property at a path with dots', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{data 'pathDatabucket' 'object1.prop\\.with\\.dots'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'de69',
            value: {
              object1: { 'prop.with.dots': 'value1', prop2: 'value2' },
              prop: 'value',
              object2: []
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value1');
    });
    it('should return the data matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{data 'jsonpathDatabucket' '$.[?(@property.match(/attribute\\.1.*/))]'}}{{data 'jsonpathDatabucket' '$.attributes.sub_attributes.*'}}{{data 'jsonpathDatabucket' '$.attributes.[attribute.with.dot].name'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'jsonpathDatabucket',
            id: 'de69',
            value: {
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
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        '["attribute-value-1","attribute-value-2"]["attribute-1-name","attribute-2-name","attribute-3-name"]value'
      );
    });
    it('should return nothing if there are no properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{data 'jsonpathDatabucket' '$.data1'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'jsonpathDatabucket',
            id: 'de69',
            value: {
              data: 'value'
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
    it('should return nothing if jsonpath filter expression is invalid', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{data "jsonPathDatabucket" \'$.phoneNumbers[0][((this.constructor.constructor("return this.process")()).mainModule.require("child_process").exec("calc").toString())]\'}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'jsonpathDatabucket',
            id: 'de69',
            value: {
              data: 'value'
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
  });

  describe('Helper: DataRaw', () => {
    it('should return nothing when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dataRaw}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return nothing if given a wrong databucket name', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dataRaw "wrongDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'rightDatabucket',
            id: 'b47g',
            value: 'value of the databucket',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return string without enclosing it in quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dataRaw 'stringDatabucket'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'stringDatabucket',
            id: 'h18t',
            value: 'test',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test');
    });

    it('should return number without without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dataRaw "numberDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'numberDatabucket',
            id: 's95a',
            value: '1',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dataRaw "booleanDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'booleanDatabucket',
            id: 'ju47',
            value: 'true',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dataRaw "nullDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'nullDatabucket',
            id: 'bv25',
            value: 'null',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'null');
    });

    it('should return array as JSON string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dataRaw "arrayDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'arrayDatabucket',
            id: 'de9s',
            value: ['first', 'second'],
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'first,second');
    });

    it('should be usable with a each', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#each (dataRaw "eachDatabucket")}}dolphin{{this}}{{/each}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'eachDatabucket',
            id: 'df95',
            value: [1, 2, 3],
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphin1dolphin2dolphin3');
    });

    it('should be usable within a if clause', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#if (dataRaw "ifDatabucket")}}dolphin{{/if}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'ifDatabucket',
            id: 'l18k',
            value: 'true',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dolphin');
    });

    it('should return the enumerated strings when databucket contains an array and no path is provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#each (dataRaw "enumDatabucket")}}{{this}}{{/each}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'enumDatabucket',
            id: 'h18h',
            value: ['string1', 'string2'],
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'string1string2');
    });

    it('should return property at a path', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dataRaw 'pathDatabucket' 'object1.prop1'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'w63q',
            value: {
              object1: { prop1: 'value1', prop2: 'value2' },
              prop: 'value',
              object2: []
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value1');
    });

    it('should return empty string if property does not exist', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dataRaw 'pathDatabucket' 'object1.prop3'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'w63q',
            value: {
              object1: { prop1: 'value1', prop2: 'value2' },
              prop: 'value',
              object2: []
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return falsy property at a path', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#if (dataRaw 'pathDatabucket' 'object1.prop1')}}truthy{{/if}}{{#if (dataRaw 'pathDatabucket' 'object1.prop2')}}falsy{{/if}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'w63q',
            value: {
              object1: { prop1: true, prop2: false }
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'truthy');
    });

    it('should return property at a path with dots', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dataRaw 'pathDatabucket' 'object1.prop\\.with\\.dots'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'de69',
            value: {
              object1: { 'prop.with.dots': 'value1' }
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value1');
    });

    it('should return property at a path with dots, when path comes from a SafeString', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dataRaw 'pathDatabucket' (queryParam 'path')}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'pathDatabucket',
            id: 'de69',
            value: {
              'prop.with.dots': 'value1'
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: { query: { path: 'prop\\.with\\.dots' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value1');
    });

    it('should return and use the array at path', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#each (dataRaw "arrayDatabucket" "arr")}}{{this}}{{/each}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'arrayDatabucket',
            id: 'h18h',
            value: { arr: ['string1', 'string2'] },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'string1string2');
    });

    it('should return the data matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{dataRaw 'jsonpathDatabucket' '$.[?(@property.match(/attribute\\.1.*/))]'}}{{dataRaw 'jsonpathDatabucket' '$.attributes.sub_attributes.*'}}{{dataRaw 'jsonpathDatabucket' '$.attributes.[attribute.with.dot].name'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'jsonpathDatabucket',
            id: 'de69',
            value: {
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
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        'attribute-value-1,attribute-value-2attribute-1-name,attribute-2-name,attribute-3-namevalue'
      );
    });

    it('should return nothing if there are no properties matching jsonpath expression', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dataRaw 'jsonpathDatabucket' '$.data1'}}",
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'jsonpathDatabucket',
            id: 'de69',
            value: {
              data: 'value'
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
    it('should return nothing if jsonpath filter expression is invalid', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{dataRaw "jsonPathDatabucket" \'$.phoneNumbers[0][((this.constructor.constructor("return this.process")()).mainModule.require("child_process").exec("calc").toString())]\'}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'jsonpathDatabucket',
            id: 'de69',
            value: {
              data: 'value'
            },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
  });

  describe('Helper: setData', () => {
    it('should return nothing when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return nothing if given a wrong databucket name', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "set" "wrongDatabucket"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 'value',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should set by default when unknown operator is provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "unknown" "myData" "" "newValue"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 'value',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'newValue');
    });

    it('should set the value (string) of a databucket (no path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "set" "myData" "" "newValue"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 'value',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'newValue');
    });

    it('should set the value (array) of a databucket (no path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "set" "myData" "" (array "newValue")}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: undefined,
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '["newValue"]');
    });

    it('should set the value of a databucket (with path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "set" "myData" "path.to.value" "newValue"}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: 'oldValue' } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'newValue');
    });

    it('should push a value to an array (no path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "push" "myData" "" "newValue"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: ['first', 'second'],
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '["first","second","newValue"]');
    });

    it('should push a value to an array (with path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "push" "myData" "path.to.array" "newValue"}}{{data "myData" "path.to.array"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { array: ['first', 'second'] } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '["first","second","newValue"]');
    });

    it('should delete a property (no path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "del" "myData"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 'value',
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'undefined');
    });

    it('should delete a property (with path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "del" "myData" "path.to.value"}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: 'oldValue' } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should increment a property (no path) by one by default', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "inc" "myData"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 1,
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '2');
    });

    it('should increment a property (with path) by one by default', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "inc" "myData" "path.to.value"}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: 1 } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '2');
    });

    it('should increment a property (no path) by providing a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "inc" "myData" "" "2"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 1,
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should increment a property (no path) by providing a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "inc" "myData" "" 2}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 1,
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should increment a property (with path) by providing a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "inc" "myData" "path.to.value" "2"}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: 1 } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should increment a property (with path) by providing a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "inc" "myData" "path.to.value" 2}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: 1 } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should decrement a property (no path) by one by default', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "dec" "myData"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 5,
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '4');
    });

    it('should decrement a property (with path) by one by default', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "dec" "myData" "path.to.value"}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: 5 } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '4');
    });

    it('should decrement a property (no path) by providing a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "dec" "myData" "" "2"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 5,
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should decrement a property (no path) by providing a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "dec" "myData" "" 2}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: 5,
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should decrement a property (with path) by providing a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "dec" "myData" "path.to.value" "2"}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: 5 } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should decrement a property (with path) by providing a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "dec" "myData" "path.to.value" 2}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: 5 } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should invert a property (no path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setData "invert" "myData"}}{{data "myData"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: true,
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should invert a property (with path)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{setData "invert" "myData" "path.to.value"}}{{data "myData" "path.to.value"}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            name: 'myData',
            id: 'abcd',
            value: { path: { to: { value: true } } },
            parsed: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });
  });
});
