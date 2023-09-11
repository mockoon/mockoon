import { test } from '@oclif/test';
import { expect } from 'chai';
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

      expect(result).to.contain('mock-content-1');

      await delay(1000);
      const logs = await parseLogs();

      expect(logs[0].message).to.equal('Server started on port 3000');
      expect(logs[1].message).to.equal('Transaction recorded');
      expect(logs[1].requestMethod).to.equal('GET');
      expect(logs[1].requestPath).to.equal('/api/test');
      expect(logs[1].responseStatus).to.equal(200);
      expect(logs[1].transaction).to.equal(undefined);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /api/test endpoint and verify logs',
      (context) => {
        expect(context.stdout).to.contain('Server started');
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

      expect(result).to.contain('mock-content-1');

      await delay(1000);

      const logs = await parseLogs();

      expect(logs[0].message).to.equal('Server started on port 3000');
      expect(logs[1].message).to.equal('Transaction recorded');
      expect(logs[1].requestMethod).to.equal('GET');
      expect(logs[1].requestPath).to.equal('/api/test');
      expect(logs[1].responseStatus).to.equal(200);
      expect(logs[1].transaction.request.method).to.equal('GET');

      expect(logs[1].transaction.request.route).to.equal('/api/test');
      expect(logs[1].transaction.response.body).to.equal('mock-content-1');
      expect(logs[1].transaction.response.statusCode).to.equal(200);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /api/test endpoint and verify logs contain transaction',
      (context) => {
        expect(context.stdout).to.contain('Server started');
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

      expect(result).to.contain('mock-content-1');

      await delay(1000);
      expect(existsSync(logsFilePath)).to.equal(false);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /api/test endpoint and verify logs file does not exist',
      (context) => {
        expect(context.stdout).to.contain('Server started');
      }
    );
});
