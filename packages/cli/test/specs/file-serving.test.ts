import { ok } from 'node:assert';
import { describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('File serving', () => {
  it('should get the file content with a relative path from the environment file (path traversal authorized if not dynamic)', async () => {
    const { instance } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/file.json'
    ]);

    const responseBody = await (
      await fetch('http://localhost:3000/file')
    ).text();

    instance.kill();

    ok(responseBody.includes('filecontent'));
  });

  it('should get the file content with a relative path from the environment file (no path traversal, same folder)', async () => {
    const { instance } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/file.json'
    ]);

    const responseBody = await (
      await fetch('http://localhost:3000/param1/mock1.json')
    ).text();

    instance.kill();

    ok(responseBody.includes('"name": "mock1"'));
  });

  it('should not get the file content with a relative path from the environment file if dynamic)', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/file.json'
    ]);

    await (await fetch('http://localhost:3000/param2/file1')).text();

    instance.kill();

    const { stdout } = await output;

    ok(
      stdout.includes(
        'Error while serving the content: Access to relative path outside of the environment base directory'
      )
    );
  });
});
