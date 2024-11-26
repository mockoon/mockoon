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
            parsed: true,
            uuid: '313619c9-a343-4a11-b1b2-f3c7fd4e5618',
            validJson: true
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
            parsed: true,
            uuid: 'c8481a51-a030-4066-8c64-42adaafe214c',
            validJson: true
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
            parsed: true,
            uuid: '8fda8dc0-d7b6-4f9f-874a-1f04901f99d9',
            validJson: true
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
            parsed: true,
            uuid: 'bfe4c50c-02ae-496b-afb0-58771a020887',
            validJson: true
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
            parsed: true,
            uuid: '94a261c4-82a0-48fc-8553-6963dc7ba7a1',
            validJson: true
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
            parsed: true,
            uuid: '7d5a1721-55c5-418c-952d-921b2e9cc7bf',
            validJson: true
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
            parsed: true,
            uuid: '26486289-42f5-456c-a8ee-391ea190f790',
            validJson: true
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
            parsed: true,
            uuid: '25f21584-ec2b-45aa-a518-c10ff20ddbc8',
            validJson: true
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
            parsed: true,
            uuid: '1279e5a0-2493-4caf-9455-7922e28fe167',
            validJson: true
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
            parsed: true,
            uuid: '9ddb7f7a-492c-4cb4-a184-4322dee99054',
            validJson: true
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
            parsed: true,
            uuid: '81d24b9b-f9fc-4f07-afe9-920b69044c95',
            validJson: true
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
            parsed: true,
            uuid: '45c8f9cd-6d08-4c0e-905d-ae6126edcad8',
            validJson: true
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
            parsed: true,
            uuid: '8e40b249-9038-47af-8b25-c1c9a3881c46',
            validJson: true
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
            parsed: true,
            uuid: 'cfd66166-783d-4f01-9093-9e4b2e1be88b',
            validJson: true
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
            parsed: true,
            uuid: 'c6b9945e-3c83-4f03-a8e8-39f8e74000d7',
            validJson: true
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
            parsed: true,
            uuid: 'df39ff19-c338-439c-9b70-db17bd55f9a7',
            validJson: true
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
            parsed: true,
            uuid: 'a02cc95e-ffa6-4597-8b59-36d9da068c47',
            validJson: true
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
            parsed: true,
            uuid: 'aff8ee83-fbd4-4efc-92b1-d8293f38fe38',
            validJson: true
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
            parsed: true,
            uuid: '7c8f27e4-5443-4bc4-884b-4db44760fb40',
            validJson: true
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
            parsed: true,
            uuid: '8581c0ce-5701-4d49-ae9c-5856e5533a6f',
            validJson: true
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
            parsed: true,
            uuid: 'ad5ddd2f-92ae-4b23-8e17-eeb908bbb2bb',
            validJson: true
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
            parsed: true,
            uuid: '092e3c37-7b19-4c9a-93f2-80322f2bc4fe',
            validJson: true
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
            parsed: true,
            uuid: 'ea4373ce-d45e-4f61-b27d-9bcc5c825602',
            validJson: true
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
            parsed: true,
            uuid: '341e2533-21d7-4937-95d9-a6f6225df50e',
            validJson: true
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
            parsed: true,
            uuid: 'e4cc3695-bd28-4c33-b25e-a4b59597b884',
            validJson: true
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
            parsed: true,
            uuid: '0a7bedc3-7810-466a-9ced-834824a0de44',
            validJson: true
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
            parsed: true,
            uuid: '62265077-a8df-4925-9b12-16e9d3859b3d',
            validJson: true
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
            parsed: true,
            uuid: '845f5471-4ceb-4574-8c0e-e50eae785a2b',
            validJson: true
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
            parsed: true,
            uuid: 'cb3dabe8-f1d8-431c-a9a0-c8a7e7a9cb92',
            validJson: true
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
            parsed: true,
            uuid: 'b1f2adb2-3071-4a69-b62f-c808002a5286',
            validJson: true
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
            parsed: true,
            uuid: '687a55c5-af70-4656-8455-2c2b068a07a8',
            validJson: true
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
            parsed: true,
            uuid: '8767a45f-b573-4e0d-8d82-8bb50d1714ff',
            validJson: true
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
            parsed: true,
            uuid: 'ffbb6449-8f26-4336-bf9b-636501aa88d8',
            validJson: true
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
            parsed: true,
            uuid: '6c1f42af-da73-4cc0-9669-ad2df128b1d9',
            validJson: true
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
            parsed: true,
            uuid: '7140a7da-e707-4a1d-8352-8c0c8c78e102',
            validJson: true
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
            parsed: true,
            uuid: 'ed8502fa-cef5-4e9f-9df0-0663102ff069',
            validJson: true
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
            parsed: true,
            uuid: '5d372b59-0114-4fd1-b6c9-371d1d63412c',
            validJson: true
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
            parsed: true,
            uuid: 'ae0f0c49-8164-4f58-9c9e-20a33e1398c4',
            validJson: true
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
            parsed: true,
            uuid: '2d91f3bb-775e-4a0d-8a5e-1d990b704f68',
            validJson: true
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
            parsed: true,
            uuid: '11d4c89d-ea59-40d2-ade7-7d0d4a003ada',
            validJson: true
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
            parsed: true,
            uuid: 'e86b3a0e-0cc5-45ca-b18e-2be4ab1dc6a5',
            validJson: true
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
            parsed: true,
            uuid: 'f53ce414-3539-4b76-b76b-f75ed87b234f',
            validJson: true
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
            parsed: true,
            uuid: 'bee15c02-2297-44b8-8835-ae0c489386fa',
            validJson: true
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
            parsed: true,
            uuid: 'ce3d3a02-ac14-48df-b3db-7af12afcc97c',
            validJson: true
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
            parsed: true,
            uuid: '8a00354c-cccb-403f-95a2-5fa4bf131d5a',
            validJson: true
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
            parsed: true,
            uuid: 'ad50cc8a-f96a-4d82-b5ac-b2c4b9393302',
            validJson: true
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
            parsed: true,
            uuid: '6da967eb-12fa-49bf-ba8c-d38dee0b6c49',
            validJson: true
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
            parsed: true,
            uuid: '591e9c04-df8e-4a63-87f0-d75f4f65dd69',
            validJson: true
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
            parsed: true,
            uuid: '0f97cd6b-4f10-466e-8746-254e7c7b4583',
            validJson: true
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
            parsed: true,
            uuid: 'afe1b9f4-2577-43e4-9728-ce3afb17addf',
            validJson: true
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
            parsed: true,
            uuid: '7476598d-de47-4089-8982-76d14cc2b45b',
            validJson: true
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
            parsed: true,
            uuid: '814973ae-9467-4272-945a-2b45c581132e',
            validJson: true
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
            parsed: true,
            uuid: '4f802a5a-c007-4f10-98db-ac0c6eb501fa',
            validJson: true
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
            parsed: true,
            uuid: 'bc473612-18ef-4c54-a705-38eb7a236180',
            validJson: true
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
            parsed: true,
            uuid: '463c6d7c-c597-4d4b-a0c3-803356c67e5a',
            validJson: true
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
