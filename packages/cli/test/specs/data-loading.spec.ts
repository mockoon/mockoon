import { test } from '@oclif/test';
import { expect } from 'chai';

describe('Data loading', () => {
  test
    .stderr()
    .command(['start', '--data', './non-existing-file.json'])
    .catch((context) => {
      expect(context.message).to.contain(
        'This file is not a valid OpenAPI specification (JSON or YAML v2.0.0 and v3.0.0) or Mockoon environment'
      );
      expect(context.message).to.contain('OpenAPI parser: Error opening file');
      expect(context.message).to.contain(
        'Mockoon parser: ENOENT: no such file or directory'
      );
    })
    .it('should fail when data file cannot be found');

  test
    .stderr()
    .command(['start', '--data', 'https://mockoon.com'])
    .catch((context) => {
      expect(context.message).to.contains(
        'This file is not a valid OpenAPI specification (JSON or YAML v2.0.0 and v3.0.0) or Mockoon environment'
      );
      expect(context.message).to.contains(
        'OpenAPI parser: "https://mockoon.com/" is not a valid JSON Schema'
      );
      // different error message for Node.js < or > 20
      expect(context.message).to.contains.oneOf([
        'Mockoon parser: Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON',
        'Mockoon parser: Unexpected token < in JSON at position 0'
      ]);
    })
    .it('should fail when the response is no valid JSON');

  test
    .stderr()
    .command(['start', '--data', 'https://malformed url'])
    .catch((context) => {
      const contains =
        context.message.indexOf(
          'Failed to parse URL from https://malformed url'
        ) >= 0;
      expect(contains).to.eql(true);
    })
    .it('should fail when the URL is invalid');

  test
    .stderr()
    .command(['start', '--data', 'https://not-existing-url'])
    .catch((context) => {
      const contains = context.message.indexOf('fetch failed') >= 0;
      expect(contains).to.eql(true);
    })
    .it('should fail when the address cannot be found');

  test
    .stderr()
    .command(['start', '--data', './test/data/envs/broken.json'])
    .catch((context) => {
      expect(context.message).to.contains(
        'This file is not a valid OpenAPI specification (JSON or YAML v2.0.0 and v3.0.0) or Mockoon environment'
      );
      // different error message for Node.js < or > 20
      expect(context.message).to.contains.oneOf([
        "Mockoon parser: Expected property name or '}' in JSON at position",
        'Mockoon parser: Unexpected token D in JSON at position'
      ]);
    })
    .it('should fail when JSON data is invalid');
});
