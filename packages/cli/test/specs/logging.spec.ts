import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';
import { existsSync, promises as fs, unlinkSync } from 'fs';
import { EOL } from 'os';
import { Config } from '../../src/config';
import { delay, stopProcesses } from '../libs/helpers';

const logsFilePath = `${Config.logsPath}mockoon-logging-test-out.log`;
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
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '--pname',
      'logging-test'
    ])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-logging-test)'
      );
    });

  test.it('should call GET /api/test endpoint and verify logs', async () => {
    const result = await axios.get('http://localhost:3000/api/test');

    expect(result.data).to.contain('mock-content-1');

    await delay(1000);
    const logs = await parseLogs();

    expect(logs[0].message).to.equal('Server started on port 3000');
    expect(logs[1].message).to.equal('GET /api/test | 200');
    expect(logs[1].transaction).to.equal(undefined);
  });

  stopProcesses('all', ['mockoon-logging-test']);
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
      '--pname',
      'logging-test',
      '--log-transaction'
    ])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-logging-test)'
      );
    });

  test.it(
    'should call GET /api/test endpoint and verify logs contain transaction',
    async () => {
      const result = await axios.get('http://localhost:3000/api/test');

      expect(result.data).to.contain('mock-content-1');

      await delay(1000);

      const logs = await parseLogs();

      expect(logs[0].message).to.equal('Server started on port 3000');
      expect(logs[1].message).to.equal('GET /api/test | 200');
      expect(logs[1].transaction.request.method).to.equal('GET');

      expect(logs[1].transaction.request.route).to.equal('/api/test');
      expect(logs[1].transaction.response.body).to.equal('mock-content-1');
      expect(logs[1].transaction.response.statusCode).to.equal(200);
    }
  );

  stopProcesses('all', ['mockoon-logging-test']);
});
