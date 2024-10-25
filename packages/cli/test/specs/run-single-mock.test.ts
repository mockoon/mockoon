import { ok, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('Run a single mock', () => {
  it('should run from data file', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json'
    ]);

    const responseBody = await (
      await fetch('http://localhost:3000/api/test')
    ).text();

    ok(responseBody.includes('mock-content-1'));

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
    ok(stdout.includes('"environmentName":"mock1"'));
  });

  it('should run from URL', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      'https://raw.githubusercontent.com/mockoon/mock-samples/main/samples/generate-mock-data.json'
    ]);

    const response = await fetch('http://localhost:3001/posts');
    strictEqual(response.status, 200);

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
    ok(stdout.includes('"environmentName":"Tutorial - Generate mock data"'));
  });
});
