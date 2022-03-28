import { test } from '@oclif/test';
import { expect } from 'chai';

describe('Data loading', () => {
  test
    .stderr()
    .command(['start', '--data', './non-existing-file.json'])
    .catch((context) => {
      expect(context.message).to.contain(
        'This file is not a valid OpenAPI specification (JSON or YAML v2.0.0 and v3.0.0) or Mockoon environment: ENOENT: no such file or directory'
      );
    })
    .it('should fail when data file cannot be found');

  test
    .stderr()
    .command(['start', '--data', 'https://example.org'])
    .catch((context) => {
      expect(context.message).to.contain(
        'This file is not a valid OpenAPI specification (JSON or YAML v2.0.0 and v3.0.0) or Mockoon environment: Unexpected token < in JSON at position 0'
      );
    })
    .it('should fail when the response is no valid JSON');

  test
    .stderr()
    .command(['start', '--data', 'https://malformed url'])
    .catch((context) => {
      const contains =
        context.message.indexOf('getaddrinfo ENOTFOUND') >= 0 ||
        context.message.indexOf('getaddrinfo EAI_AGAIN') >= 0;
      expect(contains).to.eql(true);
    })
    .it('should fail when the URL is invalid');

  test
    .stderr()
    .command(['start', '--data', 'https://not-existing-url'])
    .catch((context) => {
      const contains =
        context.message.indexOf('getaddrinfo ENOTFOUND') >= 0 ||
        context.message.indexOf('getaddrinfo EAI_AGAIN') >= 0;
      expect(contains).to.eql(true);
    })
    .it('should fail when the address cannot be found');

  test
    .stderr()
    .command(['start', '--data', './test/data/envs/broken.json'])
    .catch((context) => {
      expect(context.message).to.contain(
        'Unexpected token D in JSON at position'
      );
    })
    .it('should fail when JSON data is invalid');
});
