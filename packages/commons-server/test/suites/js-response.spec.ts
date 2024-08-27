import { strictEqual } from 'assert';
import { TemplateParser } from '../../src/libs/template-parser';

describe('JS template parser', () => {
  it('should interpret as JS when magic comment is present', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `// javascript
      result = Array.from(Array(10).keys());`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    strictEqual(
      parseResult,
      JSON.stringify(Array.from(Array(10).keys()), null, 2)
    );
  });

  it('should interpret as Handlebars when magic comment is absent', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: 'result = "hello " + "{{queryParam \'str\'}}";',
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {
        query: {
          str: 'world'
        }
      } as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, 'result = "hello " + "world";');
  });

  it('should directly invoke Mockoon helper functions', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      result = mockoon.queryParam('str');`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {
        query: {
          str: 'this is a test'
        }
      } as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, 'this is a test');
  });

  it('should directly invoke Mockoon helper functions with named parameters', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      result = mockoon.dateTimeShift({
        date: '2021-02-01T10:45:00',
        format: "yyyy-MM-dd'T'HH:mm:ss",
        days: 8,
        months: 3,
        hours: 1,
        minutes: 2,
        seconds: 3
      });`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, '2021-05-09T11:47:03');
  });

  it('should stringify object responses', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      result = {hello: "world", nums: [1, 2, 3]};`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    strictEqual(
      parseResult,
      JSON.stringify({ hello: 'world', nums: [1, 2, 3] }, null, 2)
    );
  });

  it('should not modify string responses', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      result = "this is a test";`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, 'this is a test');
  });

  it('should unwrap Handlebars SafeStrings', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      result = mockoon.queryParam('str');`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {
        query: {
          str: 'this is a test'
        }
      } as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, 'this is a test');
  });

  it('should unwrap Handlebars SafeStrings inside of objects', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      result = {some: {nested: {obj: mockoon.queryParam('str')}}};`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {
        query: {
          str: 'this is a test'
        }
      } as any,
      envVarsPrefix: ''
    });
    strictEqual(
      parseResult,
      JSON.stringify({ some: { nested: { obj: 'this is a test' } } }, null, 2)
    );
  });

  it('should return nothing if result is not set', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      // Not setting the 'result' variable`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, undefined);
  });

  it('should use Handlebars', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      const templateStr = 'Hello {{foo}}';
      const template = handlebars.compile(templateStr);
      result = template({foo: 'world'});`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, 'Hello world');
  });

  it('should use Mockoon helpers in Handlebars', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      const templateStr = '{{queryParam "str"}}';
      const template = handlebars.compile(templateStr);
      result = template({}, { helpers });`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {
        query: {
          str: 'this is a test'
        }
      } as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, 'this is a test');
  });

  it('should use custom helpers in Handlebars', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: `//JS
      const templateStr = '{{camelcase "this is a test"}}';
      const template = handlebars.compile(templateStr);
      helpers.camelcase = (str) => str.toString().toLowerCase().replace(
        /[^a-zA-Z0-9]+(.)/g,
        (m, chr) => chr.toUpperCase()
      );
      result = template({}, { helpers });`,
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    strictEqual(parseResult, 'thisIsATest');
  });
});
