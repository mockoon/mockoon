import { expect } from 'chai';
import { Response } from 'express';
import { TemplateParser } from '../../../src/libs/template-parser';

const responseMock = {
  locals: {}
} as Response;

beforeEach(function () {
  delete responseMock.locals.statusCode;
});

describe('Response helpers', () => {
  describe('Helper: status', () => {
    it('should not set the statusCode if helper not used', () => {
      TemplateParser(false, '', {} as any, [], undefined, responseMock);
      expect(responseMock.locals.statusCode).to.be.undefined;
    });

    it('should not set the statusCode if param missing', () => {
      TemplateParser(
        false,
        '{{status}}',
        {} as any,
        [],
        undefined,
        responseMock
      );
      expect(responseMock.locals.statusCode).to.be.undefined;
    });

    it('should not set the statusCode if param is NaN', () => {
      TemplateParser(
        false,
        '{{status abc}}',
        {} as any,
        [],
        undefined,
        responseMock
      );
      expect(responseMock.locals.statusCode).to.be.undefined;
    });

    it('should set status code if string passed', () => {
      TemplateParser(
        false,
        '{{status "404"}}',
        {} as any,
        [],
        undefined,
        responseMock
      );
      expect(responseMock.locals.statusCode).to.be.equal(404);
    });

    it('should set status code if number passed', () => {
      TemplateParser(
        false,
        '{{status 404}}',
        {} as any,
        [],
        undefined,
        responseMock
      );
      expect(responseMock.locals.statusCode).to.be.equal(404);
    });

    it('should not set status code as condition is not fulfilled', () => {
      TemplateParser(
        false,
        '{{#if (eq 1 0)}}{{status 404}}{{/if}}',
        {} as any,
        [],
        undefined,
        responseMock
      );
      expect(responseMock.locals.statusCode).to.be.undefined;
    });
  });
});
