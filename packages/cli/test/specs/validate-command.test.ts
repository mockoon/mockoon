import { ok } from 'node:assert';
import { mkdir, rm } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('Validate command', () => {
  before(async () => {
    await mkdir('./tmp', { recursive: true });
  });

  after(async () => {
    await rm('./tmp', { recursive: true });
  });

  it('should validate valid and invalid envs', async () => {
    const { output } = await spawnCli([
      'validate',
      '--data',
      './test/data/envs/repair.json',
      './test/data/envs/mock1.json'
    ]);

    const { stdout, stderr } = await output;

    ok(stdout.includes('Invalid environment: ./test/data/envs/repair.json'));
    ok(stdout.includes('"lastMigration" is required'));
    ok(stdout.includes('"rootChildren" is required'));
    ok(stdout.includes('"folders" is required'));
    ok(stdout.includes('"routes[0].type" is required'));
    ok(stdout.includes('"routes[0].method" is required'));
    ok(stdout.includes('"routes[0].responses[0].bodyType" is required'));
    ok(stdout.includes('"routes[0].responses[0].databucketID" is required'));
    ok(stdout.includes('"routes[0].responses[0].default" is required'));
    ok(stdout.includes('"routes[0].responses[0].crudKey" is required'));
    ok(stdout.includes('"routes[0].responses[0].callbacks" is required'));
    ok(stdout.includes('"routes[0].responseMode" is required'));
    ok(stdout.includes('"routes[0].streamingMode" is required'));
    ok(stdout.includes('"routes[0].streamingInterval" is required'));
    ok(stdout.includes('"data" is required'));
    ok(stdout.includes('"callbacks" is required'));
    ok(stdout.includes('Valid environment'));
    ok(stderr.includes('Error: Environments validation failed'));
  });

  it('should validate valid envs', async () => {
    const { output } = await spawnCli([
      'validate',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock2.json'
    ]);

    const { stdout } = await output;
    ok(stdout.includes('Valid environment'));
    ok(stdout.includes('All environments are valid'));
  });
});
