import { expect } from 'chai';
import { TemplateParser } from '../../../src/libs/template-parser';

const emptyGlobalVariables = {};

describe('Global helpers', () => {
  describe('Helper: setGlobalVar', () => {
    it('should do nothing if no param', () => {
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

    it('should set and get variable', () => {
      TemplateParser(
        false,
        "{{setGlobalVar 'data1' (bodyRaw 'prop1')}}",
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
    });
  });
});
