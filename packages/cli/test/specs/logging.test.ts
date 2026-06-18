import { existsSync, promises as fs, unlinkSync } from 'fs';
import { ok, strictEqual } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { EOL } from 'os';
import { Config } from '../../src/config';
import { delay, spawnCli } from '../libs/helpers';

const logsFilePath = `${Config.logsPath}mock1.log`;
const cleanLogs = async () => {
  if (existsSync(logsFilePath)) {
    unlinkSync(logsFilePath);
  }
};
const parseLogs = async () => {
  const logs = (await fs.readFile(logsFilePath)).toString().split(EOL);

  return logs.filter((line) => !!line).map((log) => log && JSON.parse(log));
};

describe('Logging', () => {
  beforeEach(() => {
    cleanLogs();
  });

  it('should verify basic logging and auto-generated admin token logging', async () => {
    cleanLogs();

    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json'
    ]);

    const responseBody = await (
      await fetch('http://localhost:3000/api/test')
    ).text();

    ok(responseBody.includes('mock-content-1'));

    await delay(1000);
    instance.kill();

    const logs = await parseLogs();

    strictEqual(logs[0].message, 'Server started on port 3000');
    ok(logs[1].message.startsWith('Admin API token (auto-generated): '));
    strictEqual(logs[2].message, 'Transaction recorded');
    strictEqual(logs[2].requestMethod, 'GET');
    strictEqual(logs[2].requestPath, '/api/test');
    strictEqual(logs[2].responseStatus, 200);
    strictEqual(logs[2].transaction, undefined);

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
  });

  it('should stay silent for admin auth when a token is provided', async () => {
    cleanLogs();

    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '--admin-api-token',
      'cli-admin-token'
    ]);

    const responseBody = await (
      await fetch('http://localhost:3000/api/test')
    ).text();

    ok(responseBody.includes('mock-content-1'));

    await delay(1000);
    instance.kill();

    const logs = await parseLogs();

    strictEqual(logs[0].message, 'Server started on port 3000');
    strictEqual(logs[1].message, 'Transaction recorded');
    strictEqual(logs[1].requestMethod, 'GET');
    strictEqual(logs[1].requestPath, '/api/test');
    strictEqual(logs[1].responseStatus, 200);

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
  });

  it('should verify logging with transaction logs', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '--log-transaction'
    ]);

    const responseBody = await (
      await fetch('http://localhost:3000/api/test')
    ).text();

    ok(responseBody.includes('mock-content-1'));

    await delay(1000);
    instance.kill();

    const logs = await parseLogs();

    strictEqual(logs[0].message, 'Server started on port 3000');
    strictEqual(logs[2].message, 'Transaction recorded');
    strictEqual(logs[2].requestMethod, 'GET');
    strictEqual(logs[2].requestPath, '/api/test');
    strictEqual(logs[2].responseStatus, 200);
    strictEqual(logs[2].transaction.request.method, 'GET');

    strictEqual(logs[2].transaction.request.route, '/api/test');
    strictEqual(logs[2].transaction.response.body, 'mock-content-1');
    strictEqual(logs[2].transaction.response.statusCode, 200);

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
  });

  it('should verify logging to file disabled', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--disable-log-to-file',
      '--data',
      './test/data/envs/mock1.json'
    ]);

    const responseBody = await (
      await fetch('http://localhost:3000/api/test')
    ).text();

    ok(responseBody.includes('mock-content-1'));

    await delay(1000);
    instance.kill();

    strictEqual(existsSync(logsFilePath), false);

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
  });
});
