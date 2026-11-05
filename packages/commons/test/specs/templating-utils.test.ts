import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import {
  hasRequestHelpers,
  requestHelperNames
} from '../../src/utils/templating-utils';

describe('Request helper detection', () => {
  for (const helper of requestHelperNames) {
    it(`should detect ${helper} in a template`, () => {
      strictEqual(hasRequestHelpers(`{{${helper} "value"}}`), true);
      strictEqual(hasRequestHelpers(`{{{${helper} "value"}}}`), true);
      strictEqual(hasRequestHelpers(`{{~ ${helper} "value" ~}}`), true);
      strictEqual(
        hasRequestHelpers(`{{#if (${helper} "value")}}yes{{/if}}`),
        true
      );
    });
  }

  it('should ignore plain text and non-request helpers', () => {
    for (const template of [
      '',
      'body queryParam header',
      'https://example.com/body',
      '{{getGlobalVar "callbackUrl"}}',
      '{{faker "internet.url"}}'
    ]) {
      strictEqual(hasRequestHelpers(template), false, template);
    }
  });

  it('should return consistent results across repeated calls', () => {
    strictEqual(hasRequestHelpers('{{body "url"}}'), true);
    strictEqual(hasRequestHelpers('{{body "url"}}'), true);
    strictEqual(hasRequestHelpers('{{getGlobalVar "url"}}'), false);
    strictEqual(hasRequestHelpers('{{body "url"}}'), true);
  });
});
