import { ok, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { delay, spawnCli } from '../libs/helpers';

describe('Auth flags', { concurrency: 1 }, () => {
  it('should protect admin API when --admin-api-token is provided', async () => {
    const adminApiToken = 'cli-admin-token';
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '--port',
      '3040',
      '--admin-api-token',
      adminApiToken
    ]);

    await delay(1500);

    const unauthorizedResponse = await fetch(
      'http://localhost:3040/mockoon-admin/logs'
    );
    strictEqual(unauthorizedResponse.status, 401);

    const authorizedResponse = await fetch(
      'http://localhost:3040/mockoon-admin/logs',
      {
        headers: {
          Authorization: `Bearer ${adminApiToken}`
        }
      }
    );
    strictEqual(authorizedResponse.status, 200);

    instance.kill();

    const { stdout } = await output;
    ok(stdout.includes('Server started on port 3040'));
  });

  it('should fail when API token count does not match environment count', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock2.json',
      '--admin-api-token',
      'token-1,token-2,token-3'
    ]);

    instance.kill();

    const { stderr } = await output;
    ok(
      stderr.includes(
        'The number of provided API tokens (3) must be 1 or match the number of environments (2).'
      )
    );
  });
});
