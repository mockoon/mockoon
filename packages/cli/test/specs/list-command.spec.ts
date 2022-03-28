import { test } from '@oclif/test';
import { expect } from 'chai';
import { stopProcesses } from '../libs/helpers';

describe('List no running process', () => {
  test
    .stdout()
    .command(['list'])
    .it('should list process', (context) => {
      expect(context.stdout).to.contain('No process is running');
    });
});

describe('List cannot get info for unexisting process', () => {
  test
    .stdout()
    .command(['list', 'mock25'])
    .it('should list process', (context) => {
      expect(context.stdout).to.contain(
        'No process found with pid or name "mock25"'
      );
    });
});

describe('List one process', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json', '-p', '5001'])
    .it('should start process on port 5001', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:5001 (pid: 0, name: mockoon-mock1)'
      );
    });

  test
    .stdout()
    .command(['list'])
    .it('should list process', (context) => {
      expect(context.stdout).to.contain('mock1');
      expect(context.stdout).to.contain('5001');
    });

  stopProcesses('0', ['mockoon-mock1']);
});

describe('List two processes', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json', '-p', '5001'])
    .it('should start process on port 5001', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:5001 (pid: 0, name: mockoon-mock1)'
      );
    });

  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock2.json', '-p', '5002'])
    .it('should start process on port 5002', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:5002 (pid: 1, name: mockoon-mock2)'
      );
    });

  test
    .stdout()
    .command(['list'])
    .it('should list multiple processes', (context) => {
      expect(context.stdout).to.contain('mockoon-mock1');
      expect(context.stdout).to.contain('mockoon-mock2');
      expect(context.stdout).to.contain('5001');
      expect(context.stdout).to.contain('5002');
    });

  stopProcesses('all', ['mockoon-mock1', 'mockoon-mock2']);
});

describe('List one of two processes, by name', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json', '-p', '5001'])
    .it('should start process on port 5001', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:5001 (pid: 0, name: mockoon-mock1)'
      );
    });

  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock2.json', '-p', '5002'])
    .it('should start process on port 5002', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:5002 (pid: 1, name: mockoon-mock2)'
      );
    });

  test
    .stdout()
    .command(['list', 'mockoon-mock1'])
    .it('should list multiple processes', (context) => {
      expect(context.stdout).to.contain('mockoon-mock1');
      expect(context.stdout).to.contain('5001');
    });

  stopProcesses('all', ['mockoon-mock1', 'mockoon-mock2']);
});

describe('List one of two processes, by id', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json', '-p', '5001'])
    .it('should start process on port 5001', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:5001 (pid: 0, name: mockoon-mock1)'
      );
    });

  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock2.json', '-p', '5002'])
    .it('should start process on port 5002', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:5002 (pid: 1, name: mockoon-mock2)'
      );
    });

  test
    .stdout()
    .command(['list', '1'])
    .it('should list multiple processes', (context) => {
      expect(context.stdout).to.contain('mockoon-mock2');
      expect(context.stdout).to.contain('5002');
    });

  stopProcesses('all', ['mockoon-mock1', 'mockoon-mock2']);
});
