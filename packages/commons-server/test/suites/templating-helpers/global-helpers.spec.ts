import { expect } from 'chai';
import { TemplateParser } from '../../../src/libs/template-parser';

describe('Global helpers', () => {
  describe('Helper: setGlobalVar', () => {
    it('should do nothing if no param', () => {
      const emptyGlobalVariables = {};
      TemplateParser(
        false,
        '{{setGlobalVar }}',
        {} as any,
        [],
        emptyGlobalVariables,
        {} as any
      );
      expect(emptyGlobalVariables).to.deep.equal({});
    });

    it('should do nothing if value is missing', () => {
      const emptyGlobalVariables = {};
      TemplateParser(
        false,
        "{{setGlobalVar 'data1' }}",
        {} as any,
        [],
        emptyGlobalVariables,
        {} as any
      );
      expect(emptyGlobalVariables).to.deep.equal({});
    });

    it('should store variables (testing safestring compat too)', () => {
      const emptyGlobalVariables = {};
      TemplateParser(
        false,
        "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{setGlobalVar 'data2' (bodyRaw 'prop2')}}{{setGlobalVar (queryParam 'varname') (body 'prop3')}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {
          body: { prop1: 1, prop2: false, prop3: 'hello' },
          query: { varname: 'test' }
        } as any
      );
      expect(emptyGlobalVariables['data1']).to.be.equal(1);
      expect(emptyGlobalVariables['data2']).to.be.equal(false);
      expect(emptyGlobalVariables['test']).to.be.equal('hello');
    });

    it('should get variable, return should be empty when omitting the var name', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        '{{{stringify (getGlobalVar)}}}',
        {} as any,
        [],
        emptyGlobalVariables,
        {} as any
      );
      expect(parsedContent).to.be.equal('');
    });

    it('should get variable, return should be empty with non existing var name', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        "{{{stringify (getGlobalVar 'nonexisting')}}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {} as any
      );
      expect(parsedContent).to.be.equal('');
    });

    it('should get variable, return should be default with non existing var name (number)', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        "{{{stringify (getGlobalVar 'nonexisting' null 25)}}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {} as any
      );
      expect(parsedContent).to.be.equal('25');
    });

    it('should get variable, return should be default with non existing var name (boolean)', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        "{{{stringify (getGlobalVar 'nonexisting' null false)}}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {} as any
      );
      expect(parsedContent).to.be.equal('false');
    });

    it('should get variable, return should be empty with non existing var name and path', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        "{{{stringify (getGlobalVar 'nonexisting' 'path')}}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {} as any
      );
      expect(parsedContent).to.be.equal('');
    });

    it('should set and get variable, should return full content without path', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{{stringify (getGlobalVar 'data1')}}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {
          body: { prop1: { deepprop1: 'hello' } }
        } as any
      );
      expect(emptyGlobalVariables['data1']).to.deep.equal({
        deepprop1: 'hello'
      });
      expect(parsedContent).to.deep.equal('{\n  "deepprop1": "hello"\n}');
    });

    it('should set and get variable, should return nothing when a wrong path is passed', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{{stringify (getGlobalVar 'data1' 'wrongpath')}}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {
          body: { prop1: { deepprop1: 'hello' } }
        } as any
      );
      expect(emptyGlobalVariables['data1']).to.deep.equal({
        deepprop1: 'hello'
      });
      expect(parsedContent).to.deep.equal('');
    });

    it('should set and get variable, should return default value when a wrong path is passed', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{{stringify (getGlobalVar 'data1' 'wrongpath' 'default')}}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {
          body: { prop1: { deepprop1: 'hello' } }
        } as any
      );
      expect(emptyGlobalVariables['data1']).to.deep.equal({
        deepprop1: 'hello'
      });
      expect(parsedContent).to.deep.equal('default');
    });

    it('should set and get variable, should return value when a path is passed', () => {
      const emptyGlobalVariables = {};
      const parsedContent = TemplateParser(
        false,
        "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}{{{stringify (getGlobalVar 'data1' 'deepprop1')}}}",
        {} as any,
        [],
        emptyGlobalVariables,
        {
          body: { prop1: { deepprop1: 'hello' } }
        } as any
      );
      expect(emptyGlobalVariables['data1']).to.deep.equal({
        deepprop1: 'hello'
      });
      expect(parsedContent).to.deep.equal('hello');
    });
  });
});
