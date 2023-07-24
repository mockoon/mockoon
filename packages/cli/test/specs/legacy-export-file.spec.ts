import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';

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
    .do(async () => {
      const call0 = await axios.get('http://localhost:3000/api/test');
      const call1 = await axios.get('http://localhost:3001/api/test');
      const call2 = await axios.get('http://localhost:3002/api/test');

      expect(call0.data).to.contain('mock-content-0');
      expect(call1.data).to.contain('mock-content-1');
      expect(call2.data).to.contain('mock-content-2');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start all envs and call GET /api/test endpoints and get a result'
    );
});
