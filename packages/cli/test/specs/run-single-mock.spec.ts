import { test } from '@oclif/test';
import { ok, strictEqual } from 'assert';

describe('Run single mock', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .do(async () => {
      const result = await (
        await fetch('http://localhost:3000/api/test')
      ).text();

      ok(result.includes('mock-content-1'));
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it('should start mock on port 3000 and call GET /api/test', (context) => {
      ok(context.stdout.includes('Server started'));
      ok(context.stdout.includes('"environmentName":"mock1"'));
    });
});

describe('Run single mock from URL', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      'https://raw.githubusercontent.com/mockoon/mock-samples/main/samples/generate-mock-data.json',
      '--port',
      '3000'
    ])
    .do(async () => {
      const result = await fetch('http://localhost:3000/posts');

      strictEqual(result.status, 200);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /posts endpoint',
      (context) => {
        ok(context.stdout.includes('Server started'));
        ok(
          context.stdout.includes(
            '"environmentName":"Tutorial - Generate mock data"'
          )
        );
      }
    );
});
