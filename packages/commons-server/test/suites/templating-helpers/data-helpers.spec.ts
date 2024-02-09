import { expect } from 'chai';
import { TemplateParser } from '../../../src/libs/template-parser';

describe('Data helpers', () => {
  describe('Helper: Data', () => {
    it('should return nothing when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{data}}',
        {} as any,
        [],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return nothing if given a wrong databucket name', () => {
      const parseResult = TemplateParser(
        false,
        '{{data "wrongDatabucket"}}',
        {} as any,
        [
          {
            name: 'rightDatabucket',
            id: '45fd',
            value: 'value of the databucket',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return number without without quotes', () => {
      const parseResult = TemplateParser(
        false,
        '{{data "numberDatabucket"}}',
        {} as any,
        [
          {
            name: 'numberDatabucket',
            id: 'd45s',
            value: '1',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser(
        false,
        '{{data "booleanDatabucket"}}',
        {} as any,
        [
          {
            name: 'booleanDatabucket',
            id: 'd5zs',
            value: 'true',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser(
        false,
        '{{data "nullDatabucket"}}',
        {} as any,
        [
          {
            name: 'nullDatabucket',
            id: 'gn18',
            value: 'null',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser(
        false,
        '{{data "arrayDatabucket"}}',
        {} as any,
        [
          {
            name: 'arrayDatabucket',
            id: 'szed',
            value: ['first', 'second'],
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'objectDatabucket'}}",
        {} as any,
        [
          {
            name: 'objectDatabucket',
            id: 'sc51',
            value: { key: 'value' },
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('{"key":"value"}');
    });

    it('should return string without enclosing it in quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'stringDatabucket'}}",
        {} as any,
        [
          {
            name: 'stringDatabucket',
            id: 'jh14',
            value: 'test',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('test');
    });

    it('should return property at a path', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'pathDatabucket' 'object1.prop1'}}",
        {} as any,
        [
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
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return empty string if property at a path does not exists', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'pathDatabucket' 'object1.prop3'}}",
        {} as any,
        [
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
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return falsy property at a path', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'pathDatabucket' 'object1.prop1'}}",
        {} as any,
        [
          {
            name: 'pathDatabucket',
            id: 'w63q',
            value: {
              object1: { prop1: false }
            },
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return property at a path with dots', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'pathDatabucket' 'object1.prop\\.with\\.dots'}}",
        {} as any,
        [
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
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('value1');
    });
    it('should return the data matching jsonpath expression', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'jsonpathDatabucket' '$.[?(@property.match(/attribute\\.1.*/))]'}}{{data 'jsonpathDatabucket' '$.attributes.sub_attributes.*'}}{{data 'jsonpathDatabucket' '$.attributes.[attribute.with.dot].name'}}",
        {} as any,
        [
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
        {},
        {} as any
      );
      expect(parseResult).to.be.equal(
        '["attribute-value-1","attribute-value-2"]["attribute-1-name","attribute-2-name","attribute-3-name"]value'
      );
    });
    it('should return nothing if there are no properties matching jsonpath expression', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'jsonpathDatabucket' '$.data1'}}",
        {} as any,
        [
          {
            name: 'jsonpathDatabucket',
            id: 'de69',
            value: {
              data: 'value'
            },
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: DataRaw', () => {
    it('should return nothing when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{dataRaw}}',
        {} as any,
        [],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return nothing if given a wrong databucket name', () => {
      const parseResult = TemplateParser(
        false,
        '{{dataRaw "wrongDatabucket"}}',
        {} as any,
        [
          {
            name: 'rightDatabucket',
            id: 'b47g',
            value: 'value of the databucket',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return string without enclosing it in quotes', () => {
      const parseResult = TemplateParser(
        false,
        "{{dataRaw 'stringDatabucket'}}",
        {} as any,
        [
          {
            name: 'stringDatabucket',
            id: 'h18t',
            value: 'test',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('test');
    });

    it('should return number without without quotes', () => {
      const parseResult = TemplateParser(
        false,
        '{{dataRaw "numberDatabucket"}}',
        {} as any,
        [
          {
            name: 'numberDatabucket',
            id: 's95a',
            value: '1',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser(
        false,
        '{{dataRaw "booleanDatabucket"}}',
        {} as any,
        [
          {
            name: 'booleanDatabucket',
            id: 'ju47',
            value: 'true',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser(
        false,
        '{{dataRaw "nullDatabucket"}}',
        {} as any,
        [
          {
            name: 'nullDatabucket',
            id: 'bv25',
            value: 'null',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('null');
    });

    it('should return array as JSON string', () => {
      const parseResult = TemplateParser(
        false,
        '{{dataRaw "arrayDatabucket"}}',
        {} as any,
        [
          {
            name: 'arrayDatabucket',
            id: 'de9s',
            value: ['first', 'second'],
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('first,second');
    });

    it('should be usable with a each', () => {
      const parseResult = TemplateParser(
        false,
        '{{#each (dataRaw "eachDatabucket")}}dolphin{{this}}{{/each}}',
        {} as any,
        [
          {
            name: 'eachDatabucket',
            id: 'df95',
            value: [1, 2, 3],
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('dolphin1dolphin2dolphin3');
    });

    it('should be usable within a if clause', () => {
      const parseResult = TemplateParser(
        false,
        '{{#if (dataRaw "ifDatabucket")}}dolphin{{/if}}',
        {} as any,
        [
          {
            name: 'ifDatabucket',
            id: 'l18k',
            value: 'true',
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('dolphin');
    });

    it('should return the enumerated strings when databucket contains an array and no path is provided', () => {
      const parseResult = TemplateParser(
        false,
        '{{#each (dataRaw "enumDatabucket")}}{{this}}{{/each}}',
        {} as any,
        [
          {
            name: 'enumDatabucket',
            id: 'h18h',
            value: ['string1', 'string2'],
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('string1string2');
    });

    it('should return property at a path', () => {
      const parseResult = TemplateParser(
        false,
        "{{dataRaw 'pathDatabucket' 'object1.prop1'}}",
        {} as any,
        [
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
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return empty string if property does not exist', () => {
      const parseResult = TemplateParser(
        false,
        "{{dataRaw 'pathDatabucket' 'object1.prop3'}}",
        {} as any,
        [
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
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return falsy property at a path', () => {
      const parseResult = TemplateParser(
        false,
        "{{#if (dataRaw 'pathDatabucket' 'object1.prop1')}}truthy{{/if}}{{#if (dataRaw 'pathDatabucket' 'object1.prop2')}}falsy{{/if}}",
        {} as any,
        [
          {
            name: 'pathDatabucket',
            id: 'w63q',
            value: {
              object1: { prop1: true, prop2: false }
            },
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('truthy');
    });

    it('should return property at a path with dots', () => {
      const parseResult = TemplateParser(
        false,
        "{{dataRaw 'pathDatabucket' 'object1.prop\\.with\\.dots'}}",
        {} as any,
        [
          {
            name: 'pathDatabucket',
            id: 'de69',
            value: {
              object1: { 'prop.with.dots': 'value1' }
            },
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return property at a path with dots, when path comes from a SafeString', () => {
      const parseResult = TemplateParser(
        false,
        "{{dataRaw 'pathDatabucket' (queryParam 'path')}}",
        {} as any,
        [
          {
            name: 'pathDatabucket',
            id: 'de69',
            value: {
              'prop.with.dots': 'value1'
            },
            parsed: true
          }
        ],
        {},
        { query: { path: 'prop\\.with\\.dots' } } as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return and use the array at path', () => {
      const parseResult = TemplateParser(
        false,
        '{{#each (dataRaw "arrayDatabucket" "arr")}}{{this}}{{/each}}',
        {} as any,
        [
          {
            name: 'arrayDatabucket',
            id: 'h18h',
            value: { arr: ['string1', 'string2'] },
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('string1string2');
    });
    it('should return the data matching jsonpath expression', () => {
      const parseResult = TemplateParser(
        false,
        "{{dataRaw 'jsonpathDatabucket' '$.[?(@property.match(/attribute\\.1.*/))]'}}{{dataRaw 'jsonpathDatabucket' '$.attributes.sub_attributes.*'}}{{dataRaw 'jsonpathDatabucket' '$.attributes.[attribute.with.dot].name'}}",
        {} as any,
        [
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
        {},
        {} as any
      );
      expect(parseResult).to.be.equal(
        'attribute-value-1,attribute-value-2attribute-1-name,attribute-2-name,attribute-3-namevalue'
      );
    });
    it('should return nothing if there are no properties matching jsonpath expression', () => {
      const parseResult = TemplateParser(
        false,
        "{{dataRaw 'jsonpathDatabucket' '$.data1'}}",
        {} as any,
        [
          {
            name: 'jsonpathDatabucket',
            id: 'de69',
            value: {
              data: 'value'
            },
            parsed: true
          }
        ],
        {},
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });
});
