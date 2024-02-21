import { test } from '@oclif/test';
import { expect } from 'chai';

describe('Env vars prefix custom', () => {
  test
    .env({ PREFIX_TEST_ENV_VAR: 'testenvvar', OTHER_VAR: 'othervar' })
    .stdout()
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '--env-vars-prefix',
      'PREFIX_'
    ])
    .do(async () => {
      const result = await (
        await fetch('http://localhost:3000/api/test-envvar-prefix-custom')
      ).text();

      expect(result).to.equal('testenvvar-testenvvar-');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should call endpoint and receive the env var content when prefix is a custom one and should not include other env vars',
      (context) => {
        expect(context.stdout).to.contain('Server started');
        expect(context.stdout).to.contain('"environmentName":"mock1"');
      }
    );
});
