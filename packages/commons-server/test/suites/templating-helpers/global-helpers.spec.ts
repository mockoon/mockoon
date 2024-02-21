import { expect } from 'chai';
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
      expect(emptyGlobalVariables).to.deep.equal({});
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
      expect(emptyGlobalVariables).to.deep.equal({});
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
      expect(emptyGlobalVariables['data1']).to.be.equal(1);
      expect(emptyGlobalVariables['data2']).to.be.equal(false);
      expect(emptyGlobalVariables['test']).to.be.equal('hello');
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
      expect(parsedContent).to.be.equal('');
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
      expect(parsedContent).to.be.equal('');
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
      expect(parsedContent).to.be.equal('25');
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
      expect(parsedContent).to.be.equal('false');
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
      expect(parsedContent).to.be.equal('');
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
      expect(emptyGlobalVariables['data1']).to.deep.equal({
        deepprop1: 'hello'
      });
      expect(parsedContent).to.deep.equal('{\n  "deepprop1": "hello"\n}');
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
      expect(emptyGlobalVariables['data1']).to.deep.equal({
        deepprop1: 'hello'
      });
      expect(parsedContent).to.deep.equal('');
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
      expect(emptyGlobalVariables['data1']).to.deep.equal({
        deepprop1: 'hello'
      });
      expect(parsedContent).to.deep.equal('default');
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
      expect(emptyGlobalVariables['data1']).to.deep.equal({
        deepprop1: 'hello'
      });
      expect(parsedContent).to.deep.equal('hello');
    });
  });
});
