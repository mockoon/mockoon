import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';
import { stopProcesses } from '../libs/helpers';

describe('Legacy export file', () => {
  test
    .stderr()
    .command(['start', '--data', './test/data/legacy-export-file/empty.json'])
    .catch((context) => {
      expect(context.message).to.contain(
        'No environments exist in specified file'
      );
    })
    .it('should fail when file contains no environment');

  test
    .stdout()
    .command(['start', '--data', './test/data/legacy-export-file/multi.json'])
    .it('should start all envs', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-env0-mock0)'
      );
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3001 (pid: 1, name: mockoon-env1-mock1)'
      );
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3002 (pid: 2, name: mockoon-env2-mock2)'
      );
    });

  test.it('should call GET /api/test endpoint and get a result', async () => {
    const call0 = await axios.get('http://localhost:3000/api/test');
    const call1 = await axios.get('http://localhost:3001/api/test');
    const call2 = await axios.get('http://localhost:3002/api/test');

    expect(call0.data).to.contain('mock-content-0');
    expect(call1.data).to.contain('mock-content-1');
    expect(call2.data).to.contain('mock-content-2');
  });

  stopProcesses('all', [
    'mockoon-env0-mock0',
    'mockoon-env1-mock1',
    'mockoon-env2-mock2'
  ]);
});
