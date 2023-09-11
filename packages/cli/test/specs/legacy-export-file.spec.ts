import { test } from '@oclif/test';
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
      const call0 = await (
        await fetch('http://localhost:3000/api/test')
      ).text();
      const call1 = await (
        await fetch('http://localhost:3001/api/test')
      ).text();
      const call2 = await (
        await fetch('http://localhost:3002/api/test')
      ).text();

      expect(call0).to.contain('mock-content-0');
      expect(call1).to.contain('mock-content-1');
      expect(call2).to.contain('mock-content-2');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start all envs and call GET /api/test endpoints and get a result'
    );
});
