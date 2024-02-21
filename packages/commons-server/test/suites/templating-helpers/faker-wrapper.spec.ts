import { expect } from 'chai';
import { SetFakerSeed } from '../../../src/libs/faker';
import { TemplateParser } from '../../../src/libs/template-parser';

describe('Template parser: Faker wrapper', () => {
  before(() => {
    SetFakerSeed(1);
  });

  it('should throw if helper name is missing', () => {
    expect(() => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{faker}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
    }).to.throw(
      'Faker method name is missing (valid: "location.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name is malformed', () => {
    expect(() => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{faker 'random'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
    }).to.throw(
      'random is not a valid Faker method (valid: "location.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name is malformed', () => {
    expect(() => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{faker 'random.'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
    }).to.throw(
      'random. is not a valid Faker method (valid: "location.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name does not exists', () => {
    expect(() => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{faker 'donotexists.donotexists'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
    }).to.throw(
      'donotexists.donotexists is not a valid Faker method (valid: "location.zipCode", "date.past", etc) line 1'
    );
  });

  it('should return value for simple helper', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: "{{faker 'person.firstName'}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('Hayley');
  });

  it('should return value for helper with named parameters', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: "{{faker 'number.int' min=10 max=20}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('20');
  });

  it('should return value for helper with arguments', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: "{{faker 'string.alphanumeric' 1}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('I');
  });

  it('should be able to use a string value in a switch', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content:
        "{{#switch (faker 'person.firstName')}}{{#case 'Torey'}}Torey{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('Torey');
  });

  it('should be able to use a number value in a repeat', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content:
        "{{#repeat (faker 'number.int' min=5 max=10) comma=false}}test{{/repeat}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('testtesttesttesttest');
  });

  it('should be able to use a number value in a setvar and reuse the setvar', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: "{{setVar 'nb' (faker 'number.int' min=5 max=10)}}{{@nb}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('5');
  });

  it('should be able to use a number value in a setvar and reuse the variable in a helper requiring a number (int)', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content:
        "{{setVar 'nb' (faker 'number.int' min=50 max=100)}}{{@nb}}{{int 10 @nb}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('6565');
  });

  it('should be able to use a boolean value in a if', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content:
        "{{#if (faker 'datatype.boolean')}}activated{{else}}deactivated{{/if}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('activated');
  });

  it('should be able to use an array', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content: "{{len (faker 'location.nearbyGPSCoordinate')}}",
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('2');
  });

  it('should allow objects as argument to faker function', () => {
    const parseResult = TemplateParser({
      shouldOmitDataHelper: false,
      content:
        '{{faker \'string.alpha\' \'{ length: 5, casing: "upper", exclude: ["A"] }\' }}',
      environment: {} as any,
      processedDatabuckets: [],
      globalVariables: {},
      request: {} as any,
      envVarsPrefix: ''
    });
    expect(parseResult).to.be.equal('KFKJR');
  });
});
