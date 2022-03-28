import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';
import { stopProcesses } from '../libs/helpers';

describe('Run single mock', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-mock1)'
      );
    });

  test.it('should call GET /api/test endpoint and get a result', async () => {
    const result = await axios.get('http://localhost:3000/api/test');

    expect(result.data).to.contain('mock-content-1');
  });

  stopProcesses('all', ['mockoon-mock1']);
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
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-tutorial---generate-mock-data)'
      );
    });

  test.it(
    'should call GET /api/test endpoint and get an expected 404',
    async () => {
      const result = await axios.get('http://localhost:3000/posts');
      expect(result.status).to.equal(200);
    }
  );

  stopProcesses('all', ['mockoon-tutorial---generate-mock-data']);
});

describe('Run a single mock and override the process name', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '-N',
      'process123'
    ])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-process123)'
      );
    });

  stopProcesses('mockoon-process123', ['mockoon-process123']);
});

describe('Run an https mock and verify displayed information', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock4.json'])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at https://localhost:3000 (pid: 0, name: mockoon-mockhttps)'
      );
    });

  stopProcesses('mockoon-mockhttps', ['mockoon-mockhttps']);
});
