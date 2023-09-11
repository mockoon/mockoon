import { test } from '@oclif/test';
import { expect } from 'chai';

describe('Run single mock', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .do(async () => {
      const result = await (
        await fetch('http://localhost:3000/api/test')
      ).text();

      expect(result).to.contain('mock-content-1');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it('should start mock on port 3000 and call GET /api/test', (context) => {
      expect(context.stdout).to.contain('Server started');
      expect(context.stdout).to.contain('"environmentName":"mock1"');
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

      expect(result.status).to.equal(200);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /posts endpoint',
      (context) => {
        expect(context.stdout).to.contain('Server started');
        expect(context.stdout).to.contain(
          '"environmentName":"Tutorial - Generate mock data"'
        );
      }
    );
});
