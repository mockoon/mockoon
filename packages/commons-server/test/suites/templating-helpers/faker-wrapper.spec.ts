import faker from '@faker-js/faker';
import { expect } from 'chai';
import { TemplateParser } from '../../../src/libs/template-parser';

faker.seed(1);

describe('Template parser: Faker wrapper', () => {
  it('should return value for simple helper', () => {
    const parseResult = TemplateParser(
      "{{faker 'name.firstName'}}",
      {} as any,
      {} as any
    );
    expect(parseResult).to.be.equal('Hayden');
  });

  it('should return value for helper with named parameters', () => {
    const parseResult = TemplateParser(
      "{{faker 'datatype.number' min=10 max=20}}",
      {} as any,
      {} as any
    );
    expect(parseResult).to.be.equal('20');
  });

  it('should return value for helper with arguments', () => {
    const parseResult = TemplateParser(
      "{{faker 'random.alphaNumeric' 1}}",
      {} as any,
      {} as any
    );
    expect(parseResult).to.be.equal('p');
  });

  it('should throw if helper name is missing', () => {
    expect(() => {
      TemplateParser('{{faker}}', {} as any, {} as any);
    }).to.throw(
      'Faker method name is missing (valid: "address.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name is malformed', () => {
    expect(() => {
      TemplateParser("{{faker 'random'}}", {} as any, {} as any);
    }).to.throw(
      'random is not a valid Faker method (valid: "address.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name is malformed', () => {
    expect(() => {
      TemplateParser("{{faker 'random.'}}", {} as any, {} as any);
    }).to.throw(
      'random. is not a valid Faker method (valid: "address.zipCode", "date.past", etc) line 1'
    );
  });

  it('should throw if helper name does not exists', () => {
    expect(() => {
      TemplateParser(
        "{{faker 'donotexists.donotexists'}}",
        {} as any,
        {} as any
      );
    }).to.throw(
      'donotexists.donotexists is not a valid Faker method (valid: "address.zipCode", "date.past", etc) line 1'
    );
  });
});
