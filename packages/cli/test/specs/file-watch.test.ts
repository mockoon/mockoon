import { strictEqual } from 'node:assert';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { spawnCli, wait } from '../libs/helpers';

describe('File watch', () => {
  beforeEach(async () => {
    await mkdir('./tmp', { recursive: true });
    await copyFile('./test/data/envs/mock1.json', './tmp/mock1.json');
    await copyFile('./test/data/envs/mock1.json', './tmp/mock2.json');
  });

  afterEach(async () => {
    await rm('./tmp', { recursive: true });
  });

  it('should watch a single local file', async () => {
    const { instance } = await spawnCli([
      'start',
      '--data',
      './tmp/mock1.json',
      '--port',
      '3003',
      '--watch'
    ]);

    try {
      const res1 = await (await fetch('http://localhost:3003/api/test')).text();
      strictEqual(res1, 'mock-content-1');

      const fileContent = await readFile('./tmp/mock1.json', 'utf-8');
      await writeFile(
        './tmp/mock1.json',
        fileContent.replace('mock-content-1', 'mock-content-1-updated')
      );

      await wait(3000);
      const res2 = await (await fetch('http://localhost:3003/api/test')).text();

      strictEqual(res2, 'mock-content-1-updated');
    } finally {
      // Ensure the instance is killed even if the test fails
      instance.kill();
    }
  });

  it('should watch two local files', async () => {
    const { instance } = await spawnCli([
      'start',
      '--data',
      './tmp/mock1.json',
      './tmp/mock2.json',
      '--port',
      '3003',
      '3004',
      '--watch'
    ]);

    try {
      const res1 = await (await fetch('http://localhost:3003/api/test')).text();
      strictEqual(res1, 'mock-content-1');
      const res2 = await (await fetch('http://localhost:3004/api/test')).text();
      strictEqual(res2, 'mock-content-1');

      const fileContent1 = await readFile('./tmp/mock1.json', 'utf-8');
      const fileContent2 = await readFile('./tmp/mock2.json', 'utf-8');
      await writeFile(
        './tmp/mock1.json',
        fileContent1.replace('mock-content-1', 'mock-content-1-updated')
      );
      await writeFile(
        './tmp/mock2.json',
        fileContent2.replace('mock-content-1', 'mock-content-1-updated')
      );

      await wait(3000);
      const res3 = await (await fetch('http://localhost:3003/api/test')).text();
      const res4 = await (await fetch('http://localhost:3004/api/test')).text();

      strictEqual(res3, 'mock-content-1-updated');
      strictEqual(res4, 'mock-content-1-updated');
    } finally {
      // Ensure the instance is killed even if the test fails
      instance.kill();
    }
  });
});
