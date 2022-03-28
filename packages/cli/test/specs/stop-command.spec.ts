import { test } from '@oclif/test';
import { expect } from 'chai';
import { stopProcesses } from '../libs/helpers';

describe('Stop running mock by pid', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .it('should start first mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-mock1)'
      );
    });

  stopProcesses('0', ['mockoon-mock1']);
});

describe('Stop running mock by name', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .it('should start first mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-mock1)'
      );
    });

  stopProcesses('mockoon-mock1', ['mockoon-mock1']);
});

describe('Stop all running mocks', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .it('should start first mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-mock1)'
      );
    });

  test
    .stdout()
    .command([
      'start',
      '--data',
      './test/data/envs/mock2.json',
      '--port',
      '3001'
    ])
    .it('should start second mock on port 3001', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3001 (pid: 1, name: mockoon-mock2)'
      );
    });

  stopProcesses('all', ['mockoon-mock1', 'mockoon-mock2']);
});

describe('Stop when no mock is running and no arg', () => {
  test
    .stdout()
    .command(['stop'])
    .it('should return "no process running" message', (context) => {
      expect(context.stdout).to.contain('No process is running');
    });
});

describe('Stop when no mock is running and pid arg', () => {
  test
    .stderr()
    .stdout()
    .command(['stop', '0'])
    .it('should return error and "no process running" message', (context) => {
      expect(context.stdout).to.contain('No process is running');
    });
});

describe('Stop when no mock is running and name arg', () => {
  test
    .stderr()
    .stdout()
    .command(['stop', 'test'])
    .it('should return error and "no process running" message', (context) => {
      expect(context.stdout).to.contain('No process is running');
    });
});

describe('Stop with wrong arg and list', () => {
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
    .stdout()
    .command(['stop', '99'])
    .it('should return error and "no process running" message', (context) => {
      expect(context.stderr).to.contain('Process 99 not found');
      expect(context.stdout).to.contain('mockoon-mock1');
    });

  stopProcesses('0', ['mockoon-mock1']);
});
