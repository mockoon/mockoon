import { deepStrictEqual, strictEqual } from 'assert';
import { TemplateParser } from '../../../src/libs/template-parser';

describe('Global helpers', () => {
  describe('Helper: setGlobalVar', () => {
    it('should do nothing if no param', () => {
      const emptyGlobalVariables = {};
      TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{setGlobalVar }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {} as any,
        envVarsPrefix: ''
      });
      deepStrictEqual(emptyGlobalVariables, {});
    });

    it('should do nothing if value is missing', () => {
      const emptyGlobalVariables = {};
      TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setGlobalVar 'data1' }}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {} as any,
        envVarsPrefix: ''
      });
      deepStrictEqual(emptyGlobalVariables, {});
    });

    it('should store variables (testing safestring compat too)', () => {
      const emptyGlobalVariables = {};
      TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{setGlobalVar 'data2' (bodyRaw 'prop2')}}{{setGlobalVar (queryParam 'varname') (body 'prop3')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {
          body: { prop1: 1, prop2: false, prop3: 'hello' },
          query: { varname: 'test' }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(emptyGlobalVariables['data1'], 1);
      strictEqual(emptyGlobalVariables['data2'], false);
      strictEqual(emptyGlobalVariables['test'], 'hello');
    });

    it('should get variable, return should be empty when omitting the var name', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{{stringify (getGlobalVar)}}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parsedContent, '');
    });

    it('should get variable, return should be empty with non existing var name', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{{stringify (getGlobalVar 'nonexisting')}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parsedContent, '');
    });

    it('should get variable, return should be default with non existing var name (number)', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{{stringify (getGlobalVar 'nonexisting' null 25)}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parsedContent, '25');
    });

    it('should get variable, return should be default with non existing var name (boolean)', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{{stringify (getGlobalVar 'nonexisting' null false)}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parsedContent, 'false');
    });

    it('should get variable, return should be empty with non existing var name and path', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{{stringify (getGlobalVar 'nonexisting' 'path')}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parsedContent, '');
    });

    it('should set and get variable, should return full content without path', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{{stringify (getGlobalVar 'data1')}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {
          body: { prop1: { deepprop1: 'hello' } }
        } as any,
        envVarsPrefix: ''
      });
      deepStrictEqual(emptyGlobalVariables['data1'], {
        deepprop1: 'hello'
      });
      deepStrictEqual(parsedContent, '{\n  "deepprop1": "hello"\n}');
    });

    it('should set and get variable, should return nothing when a wrong path is passed', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{{stringify (getGlobalVar 'data1' 'wrongpath')}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {
          body: { prop1: { deepprop1: 'hello' } }
        } as any,
        envVarsPrefix: ''
      });
      deepStrictEqual(emptyGlobalVariables['data1'], {
        deepprop1: 'hello'
      });
      deepStrictEqual(parsedContent, '');
    });

    it('should set and get variable, should return default value when a wrong path is passed', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{{stringify (getGlobalVar 'data1' 'wrongpath' 'default')}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {
          body: { prop1: { deepprop1: 'hello' } }
        } as any,
        envVarsPrefix: ''
      });
      deepStrictEqual(emptyGlobalVariables['data1'], {
        deepprop1: 'hello'
      });
      deepStrictEqual(parsedContent, 'default');
    });

    it('should set and get variable, should return value when a path is passed', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{{stringify (getGlobalVar 'data1' 'deepprop1')}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: emptyGlobalVariables,
        request: {
          body: { prop1: { deepprop1: 'hello' } }
        } as any,
        envVarsPrefix: ''
      });
      deepStrictEqual(emptyGlobalVariables['data1'], {
        deepprop1: 'hello'
      });
      deepStrictEqual(parsedContent, 'hello');
    });
  });
});
