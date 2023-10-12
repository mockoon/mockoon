import { expect } from 'chai';
import { localFaker as faker } from '../../../src/libs/faker';
import { TemplateParser } from '../../../src/libs/template-parser';

faker.seed(1);

describe('Template parser: Faker wrapper', () => {
  it('should throw if helper name is missing', () => {
    expect(() => {
      TemplateParser(false, '{{faker}}', {} as any, [], {} as any);
    }).to.throw(
      'Faker method name is missing (valid: "address.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name is malformed', () => {
    expect(() => {
      TemplateParser(false, "{{faker 'random'}}", {} as any, [], {} as any);
    }).to.throw(
      'random is not a valid Faker method (valid: "address.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name is malformed', () => {
    expect(() => {
      TemplateParser(false, "{{faker 'random.'}}", {} as any, [], {} as any);
    }).to.throw(
      'random. is not a valid Faker method (valid: "address.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name does not exists', () => {
    expect(() => {
      TemplateParser(
        false,
        "{{faker 'donotexists.donotexists'}}",
        {} as any,
        [],
        {} as any
      );
    }).to.throw(
      'donotexists.donotexists is not a valid Faker method (valid: "address.zipCode", "date.past", etc) line 1'
    );
  });

  it('should return value for simple helper', () => {
    const parseResult = TemplateParser(
      false,
      "{{faker 'person.firstName'}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('Hayley');
  });

  it('should return value for helper with named parameters', () => {
    const parseResult = TemplateParser(
      false,
      "{{faker 'number.int' min=10 max=20}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('20');
  });

  it('should return value for helper with arguments', () => {
    const parseResult = TemplateParser(
      false,
      "{{faker 'string.alphanumeric' 1}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('I');
  });

  it('should be able to use a string value in a switch', () => {
    const parseResult = TemplateParser(
      false,
      "{{#switch (faker 'person.firstName')}}{{#case 'Torey'}}Torey{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('Torey');
  });

  it('should be able to use a number value in a repeat', () => {
    const parseResult = TemplateParser(
      false,
      "{{#repeat (faker 'number.int' min=5 max=10) comma=false}}test{{/repeat}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('testtesttesttesttest');
  });

  it('should be able to use a number value in a setvar and reuse the setvar', () => {
    const parseResult = TemplateParser(
      false,
      "{{setVar 'nb' (faker 'number.int' min=5 max=10)}}{{@nb}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('5');
  });

  it('should be able to use a number value in a setvar and reuse the variable in a helper requiring a number (int)', () => {
    const parseResult = TemplateParser(
      false,
      "{{setVar 'nb' (faker 'number.int' min=50 max=100)}}{{@nb}}{{int 10 @nb}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('6565');
  });

  it('should be able to use a boolean value in a if', () => {
    const parseResult = TemplateParser(
      false,
      "{{#if (faker 'datatype.boolean')}}activated{{else}}deactivated{{/if}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('activated');
  });

  it('should be able to use an array', () => {
    const parseResult = TemplateParser(
      false,
      "{{len (faker 'location.nearbyGPSCoordinate')}}",
      {} as any,
      [],
      {} as any
    );
    expect(parseResult).to.be.equal('2');
  });
});
