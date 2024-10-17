import { ok } from 'node:assert';
import { describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('Serve file with relative path', () => {
  it('should start mock on port 3000 and call GET /file and get the file with a relative path from the environment file', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/file.json'
    ]);

    const responseBody = await (
      await fetch('http://localhost:3000/file')
    ).text();

    ok(responseBody.includes('filecontent'));

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
  });
});
