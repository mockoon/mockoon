import { ok } from 'node:assert';
import { describe, it } from 'node:test';
import { delay, spawnCli } from '../libs/helpers';

describe('Run multiple mocks', () => {
  it('should run different mocks on two different ports', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock2.json',
      '--port',
      '3000',
      '3001'
    ]);

    const call1 = await (await fetch('http://localhost:3000/api/test')).text();
    const call2 = await (await fetch('http://localhost:3001/api/test')).text();
    ok(call1.includes('mock-content-1'));
    ok(call2.includes('mock-content-2'));

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started on port 3000'));
    ok(stdout.includes('Server started on port 3001'));
  });

  it('should run same mock on two different ports', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock1.json',
      '--port',
      '3000',
      '3001'
    ]);

    // add more delay to make sure the two servers are up
    await delay(3000);

    const call1 = await (await fetch('http://localhost:3000/api/test')).text();
    const call2 = await (await fetch('http://localhost:3001/api/test')).text();

    ok(call1.includes('mock-content-1'));
    ok(call2.includes('mock-content-1'));

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started on port 3000'));
    ok(stdout.includes('Server started on port 3001'));
  });
});
