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
            value: 'value of the databucket',
            parsed: true
          }
        ],
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
            value: '1',
            parsed: true
          }
        ],
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
            value: 'true',
            parsed: true
          }
        ],
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
            value: 'null',
            parsed: true
          }
        ],
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
            value: ['first', 'second'],
            parsed: true
          }
        ],
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
            value: { key: 'value' },
            parsed: true
          }
        ],
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
            value: 'test',
            parsed: true
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('test');
    });

    it('should return property at the end of a path', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'pathDatabucket' 'object1.prop1'}}",
        {} as any,
        [
          {
            name: 'pathDatabucket',
            value: {
              object1: { prop1: 'value1', prop2: 'value2' },
              prop: 'value',
              object2: []
            },
            parsed: true
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return property with dots', () => {
      const parseResult = TemplateParser(
        false,
        "{{data 'pathDatabucket' 'object1.prop\\.with\\.dots'}}",
        {} as any,
        [
          {
            name: 'pathDatabucket',
            value: {
              object1: { 'prop.with.dots': 'value1', prop2: 'value2' },
              prop: 'value',
              object2: []
            },
            parsed: true
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('value1');
    });
  });

  describe('Helper: DataRaw', () => {
    it('should return nothing when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{dataRaw}}',
        {} as any,
        [],
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
            value: 'value of the databucket',
            parsed: true
          }
        ],
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
            value: 'test',
            parsed: true
          }
        ],
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
            value: '1',
            parsed: true
          }
        ],
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
            value: 'true',
            parsed: true
          }
        ],
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
            value: 'null',
            parsed: true
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser(
        false,
        '{{dataRaw "arrayDatabucket"}}',
        {} as any,
        [
          {
            name: 'arrayDatabucket',
            value: ['first', 'second'],
            parsed: true
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('first,second');
    });

    it('should be usable with a each', () => {
      const parseResult = TemplateParser(
        false,
        '{{#each (dataRaw "eachDatabucket")}}dolphin{{/each}}',
        {} as any,
        [
          {
            name: 'eachDatabucket',
            value: [1, 2, 3],
            parsed: true
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('dolphindolphindolphin');
    });

    it('should be usable within a if clause', () => {
      const parseResult = TemplateParser(
        false,
        '{{#if (dataRaw "ifDatabucket")}}dolphin{{/if}}',
        {} as any,
        [
          {
            name: 'ifDatabucket',
            value: 'true',
            parsed: true
          }
        ],
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
            value: ['string1', 'string2'],
            parsed: true
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('string1string2');
    });
  });
});
