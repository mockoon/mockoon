import { test } from '@oclif/test';
import { ok } from 'assert';

describe('Run two mocks on different ports', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock2.json',
      '--port',
      '3000',
      '3001'
    ])
    .do(async () => {
      const call1 = await (
        await fetch('http://localhost:3000/api/test')
      ).text();
      const call2 = await (
        await fetch('http://localhost:3001/api/test')
      ).text();

      ok(call1.includes('mock-content-1'));
      ok(call2.includes('mock-content-2'));
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start first mock on port 3000 and call GET /api/test endpoints and get a result',
      (context) => {
        ok(context.stdout.includes('Server started on port 3000'));
        ok(context.stdout.includes('Server started on port 3001'));
      }
    );
});

describe('Run same mock twice on different ports', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock1.json',
      '--port',
      '3000',
      '3001'
    ])
    .do(async () => {
      const call1 = await (
        await fetch('http://localhost:3000/api/test')
      ).text();
      const call2 = await (
        await fetch('http://localhost:3001/api/test')
      ).text();

      ok(call1.includes('mock-content-1'));
      ok(call2.includes('mock-content-1'));
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start first mock on port 3000 and call GET /api/test endpoints and get a result',
      (context) => {
        ok(context.stdout.includes('Server started on port 3000'));
        ok(context.stdout.includes('Server started on port 3001'));
      }
    );
});
