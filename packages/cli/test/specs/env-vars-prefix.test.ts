import { ok, strictEqual } from 'node:assert';
import { before, describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('Env vars prefix custom', () => {
  before(() => {
    process.env.PREFIX_TEST_ENV_VAR = 'testenvvar';
    process.env.OTHER_VAR = 'othervar';
  });

  it('should call endpoint and receive the env var content when prefix is a custom one and should not include other env vars', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '--env-vars-prefix',
      'PREFIX_'
    ]);

    const result = await (
      await fetch('http://localhost:3000/api/test-envvar-prefix-custom')
    ).text();

    strictEqual(result, 'testenvvar-testenvvar-');

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
    ok(stdout.includes('"environmentName":"mock1"'));
  });
});
