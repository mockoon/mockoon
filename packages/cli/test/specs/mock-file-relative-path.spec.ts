import { test } from '@oclif/test';
import { ok } from 'assert';

describe('Relative file path', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/file.json'])
    .do(async () => {
      const result = await (await fetch('http://localhost:3000/file')).text();

      ok(result.includes('filecontent'));
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /file and get the file with a relative path from the environment file',
      (context) => {
        ok(context.stdout.includes('Server started'));
      }
    );
});
