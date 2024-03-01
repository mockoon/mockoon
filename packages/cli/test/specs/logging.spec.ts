import { test } from '@oclif/test';
import { ok, strictEqual } from 'assert';
import { existsSync, promises as fs, unlinkSync } from 'fs';
import { EOL } from 'os';
import { Config } from '../../src/config';
import { delay } from '../libs/helpers';

const logsFilePath = `${Config.logsPath}mock1.log`;
const cleanLogs = () => {
  if (existsSync(logsFilePath)) {
    unlinkSync(logsFilePath);
  }
};
const parseLogs = async () => {
  const logs = (await fs.readFile(logsFilePath)).toString().split(EOL);

  return logs.map((log) => log && JSON.parse(log));
};

describe('Logging: basic logging', () => {
  test
    .stdout()
    .do(() => {
      cleanLogs();
    })
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .do(async () => {
      const result = await (
        await fetch('http://localhost:3000/api/test')
      ).text();

      ok(result.includes('mock-content-1'));

      await delay(1000);
      const logs = await parseLogs();

      strictEqual(logs[0].message, 'Server started on port 3000');
      strictEqual(logs[1].message, 'Transaction recorded');
      strictEqual(logs[1].requestMethod, 'GET');
      strictEqual(logs[1].requestPath, '/api/test');
      strictEqual(logs[1].responseStatus, 200);
      strictEqual(logs[1].transaction, undefined);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /api/test endpoint and verify logs',
      (context) => {
        ok(context.stdout.includes('Server started'));
      }
    );
});

describe('Logging: with transaction logs', () => {
  test
    .stdout()
    .do(() => {
      cleanLogs();
    })
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '--log-transaction'
    ])
    .do(async () => {
      const result = await (
        await fetch('http://localhost:3000/api/test')
      ).text();

      ok(result.includes('mock-content-1'));

      await delay(1000);

      const logs = await parseLogs();

      strictEqual(logs[0].message, 'Server started on port 3000');
      strictEqual(logs[1].message, 'Transaction recorded');
      strictEqual(logs[1].requestMethod, 'GET');
      strictEqual(logs[1].requestPath, '/api/test');
      strictEqual(logs[1].responseStatus, 200);
      strictEqual(logs[1].transaction.request.method, 'GET');

      strictEqual(logs[1].transaction.request.route, '/api/test');
      strictEqual(logs[1].transaction.response.body, 'mock-content-1');
      strictEqual(logs[1].transaction.response.statusCode, 200);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /api/test endpoint and verify logs contain transaction',
      (context) => {
        ok(context.stdout.includes('Server started'));
      }
    );
});

describe('Logging: logging to file disabled', () => {
  test
    .stdout()
    .do(() => {
      cleanLogs();
    })
    .command([
      'start',
      '--disable-log-to-file',
      '--data',
      './test/data/envs/mock1.json'
    ])
    .do(async () => {
      const result = await (
        await fetch('http://localhost:3000/api/test')
      ).text();

      ok(result.includes('mock-content-1'));

      await delay(1000);
      strictEqual(existsSync(logsFilePath), false);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /api/test endpoint and verify logs file does not exist',
      (context) => {
        ok(context.stdout.includes('Server started'));
      }
    );
});
