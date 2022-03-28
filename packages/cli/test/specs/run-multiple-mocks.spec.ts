import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';
import { stopProcesses } from '../libs/helpers';

describe('Run two mocks on the same port', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .it('should start first mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-mock1)'
      );
    });

  test
    .stderr()
    .command(['start', '--data', './test/data/envs/mock2.json'])
    .catch((context) => {
      expect(context.message).to.contain('Port "3000" is already in use');
    })
    .it('should fail starting second mock on same port');

  stopProcesses('all', ['mockoon-mock1']);
});

describe('Run two mocks on different ports, with different process names', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock2.json',
      '--port',
      '3005',
      '3006',
      '--pname',
      'pname1',
      'pname2'
    ])
    .it('should start first mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3005 (pid: 0, name: mockoon-pname1)'
      );
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3006 (pid: 1, name: mockoon-pname2)'
      );
    });

  test.it('should call GET /api/test endpoint and get a result', async () => {
    const call1 = await axios.get('http://localhost:3005/api/test');
    const call2 = await axios.get('http://localhost:3006/api/test');

    expect(call1.data).to.contain('mock-content-1');
    expect(call2.data).to.contain('mock-content-2');
  });

  stopProcesses('all', ['mockoon-pname1', 'mockoon-pname2']);
});

describe('Run two mocks with same name', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .it('should start first mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-mock1)'
      );
    });

  test
    .stderr()
    .command([
      'start',
      '--data',
      './test/data/envs/mock3.json',
      '--port',
      '3001'
    ])
    .catch((context) => {
      expect(context.message).to.contain(
        'A process with the name "mockoon-mock1" is already running'
      );
    })
    .it('should fail starting second mock on port 3001 due to name error');

  test.it(
    'should call GET /api/test endpoint and still get "mock1" result',
    async () => {
      const call = await axios.get('http://localhost:3000/api/test');

      expect(call.data).to.contain('mock-content-1');
    }
  );

  test.it(
    'should not get a result when calling GET /api/test endpoint on port 3001',
    async () => {
      try {
        await axios.get('http://localhost:3001/api/test');
      } catch (error: any) {
        expect(error.message).to.equal('connect ECONNREFUSED 127.0.0.1:3001');
      }
    }
  );

  stopProcesses('all', ['mockoon-mock1']);
});
