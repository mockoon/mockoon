import { ok } from 'node:assert';
import { describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('Data loading', () => {
  it('should fail when data file cannot be found', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './non-existing-file.json'
    ]);

    instance.kill();

    const { stderr } = await output;
    ok(stderr.includes('This file is not a valid OpenAPI specification'));
    ok(stderr.includes('OpenAPI parser: Error opening file'));
    ok(stderr.includes('Mockoon parser: ENOENT: no such file or directory'));
  });

  it('should fail when the response is no valid JSON', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      'https://mockoon.com'
    ]);

    instance.kill();

    const { stderr } = await output;
    ok(stderr.includes('This file is not a valid OpenAPI specification'));
    ok(
      stderr.includes(
        'OpenAPI parser: "https://mockoon.com/" is not a valid JSON Schema'
      )
    );
    // different error message for Node.js < or > 20
    ok(
      stderr.includes(
        'Mockoon parser: Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON'
      ) ||
        stderr.includes(
          'Mockoon parser: Unexpected token < in JSON at position 0'
        )
    );
  });

  it('should fail when the URL is invalid', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      'https://malformed url'
    ]);

    instance.kill();

    const { stderr } = await output;
    ok(stderr.includes('Failed to parse URL from https://malformed url'));
  });

  it('should fail when the address cannot be found', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      'https://not-existing-url'
    ]);

    instance.kill();

    const { stderr } = await output;
    ok(stderr.includes('fetch failed'));
  });

  it('should fail when JSON data is invalid', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/broken.json'
    ]);

    instance.kill();

    const { stderr } = await output;
    ok(stderr.includes('This file is not a valid OpenAPI specification'));
    // different error message for Node.js < or > 20
    ok(
      stderr.includes(
        "Mockoon parser: Expected property name or '}' in JSON at position"
      ) ||
        stderr.includes(
          'Mockoon parser: Unexpected token D in JSON at position'
        )
    );
  });
});
