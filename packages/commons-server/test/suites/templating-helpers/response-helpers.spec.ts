import { strictEqual } from 'assert';
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
      TemplateParser({
        shouldOmitDataHelper: false,
        content: '',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: undefined,
        response: responseMock,
        envVarsPrefix: ''
      });
      strictEqual(responseMock.locals.statusCode, undefined);
    });

    it('should not set the statusCode if param missing', () => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{status}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: undefined,
        response: responseMock,
        envVarsPrefix: ''
      });
      strictEqual(responseMock.locals.statusCode, undefined);
    });

    it('should not set the statusCode if param is NaN', () => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{status abc}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: undefined,
        response: responseMock,
        envVarsPrefix: ''
      });
      strictEqual(responseMock.locals.statusCode, undefined);
    });

    it('should set status code if string passed', () => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{status "404"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: undefined,
        response: responseMock,
        envVarsPrefix: ''
      });
      strictEqual(responseMock.locals.statusCode, 404);
    });

    it('should set status code if number passed', () => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{status 404}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: undefined,
        response: responseMock,
        envVarsPrefix: ''
      });
      strictEqual(responseMock.locals.statusCode, 404);
    });

    it('should not set status code as condition is not fulfilled', () => {
      TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#if (eq 1 0)}}{{status 404}}{{/if}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: undefined,
        response: responseMock,
        envVarsPrefix: ''
      });
      strictEqual(responseMock.locals.statusCode, undefined);
    });
  });
});
