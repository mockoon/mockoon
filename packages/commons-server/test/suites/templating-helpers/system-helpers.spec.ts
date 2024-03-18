import { strictEqual } from 'assert';
import { TemplateParser } from '../../../src/libs/template-parser';

describe('System helpers', () => {
  describe('Helper: getEnvVar', () => {
    before(() => {
      process.env.TEST_ENV_VAR1 = 'test';
      process.env.PREFIX_TEST_ENV_VAR3 = 'testprefix';
    });

    it('should do nothing if no param', () => {
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{getEnvVar}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parsedContent, '');
    });

    it('should return env var value when exists', () => {
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{getEnvVar 'TEST_ENV_VAR1'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parsedContent, 'test');
    });

    it('should return nothing if env var does not exist', () => {
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{getEnvVar 'TEST_ENV_VAR2'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parsedContent, '');
    });

    it('should return default value if provided and env var does not exist', () => {
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{getEnvVar 'TEST_ENV_VAR2' 'default'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parsedContent, 'default');
    });

    it('should be able to return all variables when there is no prefix', () => {
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{getEnvVar 'TEST_ENV_VAR1'}}-{{getEnvVar 'PREFIX_TEST_ENV_VAR3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parsedContent, 'test-testprefix');
    });

    it('should be able to return only prefixed variables when there is a prefix (prefix in helper is optional', () => {
      const parsedContent = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{getEnvVar 'TEST_ENV_VAR1'}}-{{getEnvVar 'PREFIX_TEST_ENV_VAR3'}}-{{getEnvVar 'TEST_ENV_VAR3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: 'PREFIX_'
      });

      strictEqual(parsedContent, '-testprefix-testprefix');
    });
  });
});
